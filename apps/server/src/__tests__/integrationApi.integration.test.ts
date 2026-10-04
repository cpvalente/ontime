import { OntimeEvent, Playback, Rundown, RuntimeStore, SupportedEntry } from 'ontime-types';

import { type TestServer, startTestServer } from './testServer.js';

/**
 * The HTTP integration API (/api) is the public contract used by show control software
 * It mirrors the OSC and websocket adapters, which share the same dispatcher
 */
describe('HTTP integration API', () => {
  let server: TestServer;
  let rundown: Rundown;
  let firstEventId: string;

  // starting the server loads the full module graph, which takes a few seconds on slower machines
  beforeAll(async () => {
    server = await startTestServer();
    rundown = await (await server.get('/data/rundowns/current')).json();
    firstEventId = rundown.flatOrder.find((id) => rundown.entries[id].type === SupportedEntry.Event)!;
  }, 15_000);

  afterAll(async () => {
    await server?.stop();
  });

  async function action(path: string) {
    const response = await server.get(`/api${path}`);
    return { status: response.status, body: await response.json() };
  }

  async function poll(): Promise<RuntimeStore> {
    const { body } = await action('/poll');
    return body.payload;
  }

  test('controls playback of the loaded rundown', async () => {
    expect(await action('/load/index/1')).toEqual({ status: 202, body: { payload: 'success' } });
    let state = await poll();
    expect(state.eventNow?.id).toBe(firstEventId);
    expect(state.timer.playback).toBe(Playback.Armed);

    await action('/start');
    expect((await poll()).timer.playback).toBe(Playback.Play);

    await action('/addtime/add/60000');
    state = await poll();
    expect(state.timer.addedTime).toBe(60000);

    await action('/pause');
    expect((await poll()).timer.playback).toBe(Playback.Pause);

    await action('/stop');
    state = await poll();
    expect(state.timer.playback).toBe(Playback.Stop);
    expect(state.eventNow).toBeNull();
  });

  test('edits an entry of the loaded rundown with change', async () => {
    expect(await action(`/change/${firstEventId}/title/Edited-from-API`)).toEqual({
      status: 202,
      body: { payload: 'success' },
    });

    const updated: Rundown = await (await server.get('/data/rundowns/current')).json();
    expect((updated.entries[firstEventId] as OntimeEvent).title).toBe('Edited-from-API');
  });

  test('rejects unknown actions and invalid payloads with a message', async () => {
    expect(await action('/not-an-action')).toEqual({
      status: 500,
      body: { message: 'Unhandled message not-an-action' },
    });
    expect(await action('/start/index/0')).toEqual({ status: 500, body: { message: 'Event index out of range 0' } });
  });
});
