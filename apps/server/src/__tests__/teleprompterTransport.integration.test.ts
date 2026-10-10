import {
  MessageTag,
  type OntimeEvent,
  type Rundown,
  type RuntimeStore,
  SupportedEntry,
  type TeleprompterScript,
  type TeleprompterState,
} from 'ontime-types';
import { makeTeleprompterLayout, syncPositionAt } from 'ontime-utils';
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

  async function teleprompter(path: string): Promise<TeleprompterState> {
    const { status, body } = await command(path);
    expect(status).toBe(202);
    return body.payload!;
  }

  async function poll(): Promise<RuntimeStore> {
    return (await (await server.get('/api/poll')).json()).payload;
  }

  /** the row where an event's text starts, in the shared script */
  async function startRowOf(eventId: string) {
    const script: TeleprompterScript = await (await server.get('/data/teleprompter/script')).json();
    return makeTeleprompterLayout(script.events).events.find((event) => event.id === eventId)?.startRow;
  }

  /** Collects the runtime patches broadcast after the whole store, which a new connection receives first */
  function listen() {
    const messages: Partial<RuntimeStore>[] = [];
    const socket = new WebSocket(`${server.baseUrl.replace('http', 'ws')}/ws`);
    const open = new Promise<void>((resolve) => {
      let hasStore = false;
      socket.on('message', (data) => {
        const message = JSON.parse((data as Buffer).toString());
        if (message.tag !== MessageTag.RuntimeData) return;
        if (hasStore) messages.push(message.payload);
        hasStore = true;
        resolve();
      });
    });
    return { messages, socket, open };
  }

  test('every command replies with the teleprompter after it, which the runtime store holds', async () => {
    const [first, second, third] = events;
    expect(await teleprompter('speed/20')).toMatchObject({ speed: 20 });
    expect(await teleprompter('top')).toMatchObject({ event: { id: first.id } });
    expect(await teleprompter('next')).toMatchObject({
      event: { id: second.id, cue: second.cue, title: second.title },
    });
    expect(await teleprompter(`goto/cue/${third.cue}`)).toMatchObject({ event: { id: third.id } });
    expect(await teleprompter('goto/index/2')).toMatchObject({ event: { id: second.id } });
    const playing = await teleprompter('toggle');
    expect(playing).toMatchObject({ playback: 'play', ended: null });
    expect(playing.endsAt).toEqual(expect.any(Number));

    const store = await poll();
    expect(store.teleprompter).toMatchObject({ playback: 'play', event: { id: second.id } });
    expect(store.teleprompterSync).toMatchObject({ playback: 'play', speed: 20, row: await startRowOf(second.id) });
    expect((await teleprompter('pause')).endsAt).toBeNull();
  });

  test('an event which is not in the script is refused', async () => {
    expect(await command('goto/cue/no-such-cue')).toEqual({ status: 500, body: { message: 'Event not found' } });
  });

  test('events without script do not exist for the teleprompter', async () => {
    const [, second, third] = events;
    await editNote(second.id, '');
    await vi.waitFor(async () => {
      expect(await teleprompter('goto/index/2')).toMatchObject({ event: { id: third.id } });
    });
    expect(await command(`goto/id/${second.id}`)).toEqual({ status: 500, body: { message: 'Event not found' } });

    expect((await server.get('/api/load/index/2')).ok).toBe(true);
    expect(await command('goto/loaded')).toEqual({ status: 500, body: { message: 'Event not found' } });

    await server.get('/api/stop');
    await editNote(second.id, 'Line 2.');
  });

  test('event by event, loading an event moves the reader to its start, and playback carries on from there', async () => {
    const [first, second] = events;
    await teleprompter(`goto/id/${first.id}`);
    await teleprompter('speed/1');
    await teleprompter('play');

    expect((await server.get('/api/load/index/2')).ok).toBe(true);
    expect((await poll()).teleprompterSync).toMatchObject({ playback: 'play', row: await startRowOf(second.id) });
    await teleprompter('top');
    expect(await teleprompter('goto/loaded')).toMatchObject({ event: { id: second.id } });

    await teleprompter('pause');
    await server.get('/api/stop');
  });

  test('event by event, playback stops at the end of the event and the state is broadcast', async () => {
    const { messages, socket, open } = listen();
    await open;

    const [first] = events;
    await teleprompter(`goto/id/${first.id}`);
    await teleprompter('speed/40');
    await teleprompter('play');

    await vi.waitFor(
      () => {
        const updates = messages.filter((payload) => payload.teleprompter);
        expect(updates.at(-1)?.teleprompter).toMatchObject({
          playback: 'pause',
          ended: 'event',
          event: { id: first.id },
          remaining: 0,
        });
      },
      // playback stops on the clock tick after it reaches the end, up to a second later
      { timeout: 5000 },
    );
    socket.close();
  }, 10_000);

  test('reading the whole script, loading does not move the reader', async () => {
    const [first] = events;
    expect(await teleprompter('mode/toggle')).toMatchObject({ mode: 'script' });

    await teleprompter(`goto/id/${first.id}`);
    const parked = (await poll()).teleprompterSync;
    expect((await server.get('/api/load/index/3')).ok).toBe(true);
    expect((await poll()).teleprompterSync).toEqual(parked);

    await server.get('/api/stop');
    expect(await teleprompter('mode/toggle')).toMatchObject({ mode: 'event' });
  });

  test('while playing, the teleprompter is sent with the clock every second, and the sync key only on commands', async () => {
    const [first] = events;
    await teleprompter(`goto/id/${first.id}`);
    await teleprompter('speed/1');
    const { messages, socket, open } = listen();
    await open;

    await teleprompter('play');
    await vi.waitFor(() => expect(messages.filter((payload) => payload.clock && payload.teleprompter).length).toBe(2), {
      timeout: 3000,
    });
    const syncUpdates = messages.filter((payload) => payload.teleprompterSync);
    expect(syncUpdates).toHaveLength(1);
    expect(syncUpdates[0].teleprompter).toMatchObject({ playback: 'play' });

    await teleprompter('pause');
    messages.length = 0;
    await vi.waitFor(() => expect(messages.filter((payload) => payload.clock).length).toBeGreaterThan(1), {
      timeout: 3000,
    });
    expect(messages.some((payload) => payload.teleprompter)).toBe(false);
    socket.close();
  });

  test('an edit during playback re-anchors the reader, who carries on without a jump', async () => {
    const [first, second] = events;
    await teleprompter(`goto/id/${second.id}`);
    await teleprompter('speed/2');
    await teleprompter('play');
    const playing = (await poll()).teleprompterSync;

    // the event above gains two lines
    await editNote(first.id, 'Line 1.\nAnother line.\nAnd another.');

    await vi.waitFor(async () => {
      // the edit tells screens to refetch the script, which rebuilds it
      await server.get('/data/teleprompter/script');
      const sync = (await poll()).teleprompterSync;
      expect(sync.at).toBeGreaterThan(playing.at);
      expect(sync.revision).toBeGreaterThan(playing.revision);
      expect(sync.playback).toBe('play');
      const now = timeCore.timeOfDayNow();
      // two more lines above, and the reader moved on by speed × time
      expect(syncPositionAt(sync, now)).toBeCloseTo(syncPositionAt(playing, now) + 2, 1);
    });

    await teleprompter('pause');
  });
});
