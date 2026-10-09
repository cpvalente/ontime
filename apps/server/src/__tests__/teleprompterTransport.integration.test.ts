import {
  MessageTag,
  type OntimeEvent,
  type Rundown,
  type RuntimeStore,
  SupportedEntry,
  type TeleprompterScript,
  type TeleprompterState,
} from 'ontime-types';
import { makeTeleprompterLayout, positionAt, startOfEvent } from 'ontime-utils';
import { WebSocket } from 'ws';

import * as timeCore from '../lib/time-core/timeCore.js';
import { type TestServer, startTestServer } from './testServer.js';

/**
 * The teleprompter transport lives on the server, so every remote screen follows the same one
 * It is driven through the integration API, which HTTP, OSC and the websocket share
 */
describe('teleprompter transport', () => {
  let server: TestServer;
  let rundown: Rundown;
  let events: OntimeEvent[];

  beforeAll(async () => {
    server = await startTestServer();
    rundown = await (await server.get('/data/rundowns/current')).json();
    events = rundown.flatOrder
      .map((id) => rundown.entries[id])
      .filter((entry): entry is OntimeEvent => entry.type === SupportedEntry.Event && !entry.skip);

    // short scripts, so playback reaches the end of an event in a moment
    for (const [index, event] of events.slice(0, 3).entries()) {
      // oxlint-disable-next-line no-await-in-loop - each edit commits the rundown in turn
      await editNote(event.id, `Line ${index + 1}.`);
    }
  }, 15_000);

  afterAll(async () => {
    await server?.stop();
  });

  async function editNote(id: string, note: string) {
    const response = await server.send('PUT', `/data/rundowns/${rundown.id}/entry`, { id, note });
    expect(response.ok).toBe(true);
  }

  async function command(
    path: string,
  ): Promise<{ status: number; body: { payload?: TeleprompterState; message?: string } }> {
    const response = await server.get(`/api/teleprompter/${path}`);
    return { status: response.status, body: await response.json() };
  }

  async function transport(path: string): Promise<TeleprompterState> {
    const { status, body } = await command(path);
    expect(status).toBe(202);
    return body.payload!;
  }

  async function poll(): Promise<RuntimeStore> {
    return (await (await server.get('/api/poll')).json()).payload;
  }

  async function setFollowLoaded(followLoaded: boolean) {
    const viewSettings = await (await server.get('/data/view-settings')).json();
    const teleprompter = { ...viewSettings.teleprompter, followLoaded };
    expect((await server.send('POST', '/data/view-settings', { ...viewSettings, teleprompter })).ok).toBe(true);
  }

  /** where the reader is, in rows of the shared script */
  async function readerRow(state: TeleprompterState, now: number = timeCore.timeOfDayNow()) {
    const script: TeleprompterScript = await (await server.get('/data/teleprompter/script')).json();
    return positionAt(state, makeTeleprompterLayout(script.events), now, { cued: true });
  }

  test('RMT-4 the transport is the teleprompter key of the runtime store', async () => {
    const state = await transport('pause');
    expect((await poll()).teleprompter).toEqual(state);
  });

  test('RMT-5 every command replies with the state after it', async () => {
    const [first, second, third] = events;
    expect(await transport('speed/20')).toMatchObject({ speed: 20 });
    expect(await transport('speed/by/-2')).toMatchObject({ speed: 18 });
    expect(await transport('top')).toMatchObject({ anchor: startOfEvent(first.id), eventId: first.id });
    expect(await transport('next')).toMatchObject({ anchor: startOfEvent(second.id), cue: second.cue });
    expect(await transport('previous')).toMatchObject({ anchor: startOfEvent(first.id) });
    expect(await transport(`goto/cue/${third.cue}`)).toMatchObject({ anchor: startOfEvent(third.id) });
    expect(await transport('goto/index/2')).toMatchObject({ anchor: startOfEvent(second.id) });
    expect(await transport(`goto/id/${first.id}`)).toMatchObject({ anchor: startOfEvent(first.id) });

    const before = await readerRow(await transport('top'));
    expect(await readerRow(await transport('scroll/3'))).toBe(before! + 3);

    expect(await transport('toggle')).toMatchObject({ playing: true });
    expect(await transport('pause')).toMatchObject({ playing: false });
  });

  test('RMT-6 invalid commands and events which are not in the script are refused', async () => {
    expect(await command('stop')).toEqual({ status: 500, body: { message: 'Invalid teleprompter command' } });
    expect(await command('speed/fast')).toEqual({ status: 500, body: { message: 'Invalid teleprompter command' } });
    expect(await command('goto/cue/no-such-cue')).toEqual({ status: 500, body: { message: 'Event not found' } });
  });

  test('TRN-3 cued, loading an event moves the reader to its start, and playback carries on from there', async () => {
    const [first, second] = events;
    await transport(`goto/id/${first.id}`);
    await transport('speed/1');
    await transport('play');

    expect((await server.get('/api/load/index/2')).ok).toBe(true);
    expect((await poll()).teleprompter).toMatchObject({ playing: true, anchor: startOfEvent(second.id) });
    expect(await transport('loaded')).toMatchObject({ anchor: startOfEvent(second.id) });

    await transport('pause');
    await server.get('/api/stop');
  });

  test('TRN-3 TRN-5 cued, playback stops at the end of the event and the state is broadcast', async () => {
    const messages: { tag: string; payload: Partial<RuntimeStore> }[] = [];
    const socket = new WebSocket(`${server.baseUrl.replace('http', 'ws')}/ws`);
    socket.on('message', (data) => messages.push(JSON.parse((data as Buffer).toString())));
    await new Promise((resolve) => socket.once('open', resolve));

    const [first] = events;
    await transport(`goto/id/${first.id}`);
    await transport('speed/40');
    await transport('play');

    await vi.waitFor(
      () => {
        const stops = messages.filter(
          (message) => message.tag === MessageTag.RuntimeData && message.payload.teleprompter,
        );
        expect(stops.at(-1)?.payload.teleprompter).toMatchObject({
          playing: false,
          stoppedAt: 'event',
          eventId: first.id,
        });
      },
      { timeout: 4000 },
    );
    socket.close();
  });

  test('TRN-4 free run, loading does not move the reader and playback reads on across events', async () => {
    const [first, second] = events;
    await setFollowLoaded(false);

    const parked = await transport(`goto/id/${first.id}`);
    expect((await server.get('/api/load/index/3')).ok).toBe(true);
    expect((await poll()).teleprompter.anchor).toEqual(parked.anchor);

    await transport('speed/40');
    await transport('play');
    await vi.waitFor(
      async () => expect((await poll()).teleprompter).toMatchObject({ playing: true, eventId: second.id }),
      {
        timeout: 6000,
      },
    );

    await transport('pause');
    await server.get('/api/stop');
    await setFollowLoaded(true);
  }, 10_000);

  test('POS-5 an edit during playback re-anchors the reader, who carries on without a jump', async () => {
    const [first, second] = events;
    await transport(`goto/id/${second.id}`);
    await transport('speed/2');
    const playing = await transport('play');
    const before = await readerRow(playing);

    // the event above gains two lines
    await editNote(first.id, 'Line 1.\nAnother line.\nAnd another.');

    await vi.waitFor(async () => {
      // the edit tells screens to refetch the script, which rebuilds it
      await server.get('/data/teleprompter/script');
      const state = (await poll()).teleprompter;
      expect(state.since).toBeGreaterThan(playing.since);
      expect(state).toMatchObject({ playing: true, anchor: { eventId: second.id } });
      const now = timeCore.timeOfDayNow();
      // two more lines above, and the reader moved on by speed × time
      const expected = before! + 2 + (2 * (now - playing.since)) / 60_000;
      expect(await readerRow(state, now)).toBeCloseTo(expected, 1);
    });

    await transport('pause');
  });
});
