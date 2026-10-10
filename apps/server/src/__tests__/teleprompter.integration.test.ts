import { type Rundown, SupportedEntry, type TeleprompterScript } from 'ontime-types';

import { type TestServer, startTestServer } from './testServer.js';

/**
 * The teleprompter script is built on the server, so every screen shows the same lines
 */
describe('teleprompter script', () => {
  let server: TestServer;
  let rundown: Rundown;
  let eventId: string;

  beforeAll(async () => {
    server = await startTestServer();
    rundown = await (await server.get('/data/rundowns/current')).json();
    eventId = rundown.flatOrder.find((id) => rundown.entries[id].type === SupportedEntry.Event)!;
  }, 15_000);

  afterAll(async () => {
    await server?.stop();
  });

  async function getScript(): Promise<TeleprompterScript> {
    return (await server.get('/data/teleprompter/script')).json();
  }

  function textOf(script: TeleprompterScript) {
    return script.events.find((event) => event.id === eventId)?.lines.filter((line) => line.kind === 'text');
  }

  async function edit(patch: object) {
    const response = await server.send('PUT', `/data/rundowns/${rundown.id}/entry`, { id: eventId, ...patch });
    expect(response.ok).toBe(true);
  }

  test('serves the script as rows, each text row with its place in the text', async () => {
    await edit({ note: 'Good evening and welcome to the 2026 awards.' });

    const shared = await getScript();
    expect(shared.charsPerLine).toBe(32);
    expect(textOf(shared)).toEqual([
      { kind: 'text', text: 'Good evening and welcome to the', start: 0 },
      { kind: 'text', text: '2026 awards.', start: 32 },
    ]);
  });

  test('an edit to the text raises the revision, an edit to anything else keeps it and the ETag', async () => {
    const before = await server.get('/data/teleprompter/script');
    const { revision } = (await before.json()) as TeleprompterScript;

    await edit({ colour: '#ff7300' });
    // fetch asks past caches when given If-None-Match, unless the request sets its own Cache-Control
    const unchanged = await server.request('/data/teleprompter/script', {
      headers: { 'If-None-Match': before.headers.get('etag')!, 'Cache-Control': 'max-age=0' },
    });
    expect(unchanged.status).toBe(304);

    await edit({ note: 'A new script' });
    const after = await getScript();
    expect(after.revision).toBe(revision + 1);
    expect(textOf(after)).toEqual([{ kind: 'text', text: 'A new script', start: 0 }]);
  });

  test('the project settings shape the shared script', async () => {
    const settings = await (await server.get('/data/teleprompter/settings')).json();
    expect(settings).toEqual({ script: 'note', charsPerLine: 32, heading: 'title' });

    const response = await server.send('POST', '/data/teleprompter/settings', { ...settings, script: 'title' });
    expect(response.ok).toBe(true);

    await vi.waitFor(async () => {
      expect(textOf(await getScript())).toEqual([
        { kind: 'text', text: (rundown.entries[eventId] as { title: string }).title, start: 0 },
      ]);
    });
  });
});
