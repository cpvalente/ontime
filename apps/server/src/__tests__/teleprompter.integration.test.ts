import { MessageTag, RefetchKey, type Rundown, SupportedEntry, type TeleprompterScript } from 'ontime-types';
import { WebSocket } from 'ws';

import { type TestServer, startTestServer } from './testServer.js';

/**
 * The teleprompter script is built on the server, so every screen shows the same lines
 */
describe('teleprompter', () => {
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

  async function getScript(query = ''): Promise<TeleprompterScript> {
    return (await server.get(`/data/teleprompter/script${query}`)).json();
  }

  async function editNote(note: string) {
    const response = await server.send('PUT', `/data/rundowns/${rundown.id}/entry`, { id: eventId, note });
    expect(response.ok).toBe(true);
  }

  test('SCR-5 serves the script as events with rows, each text row with its place in the text', async () => {
    await editNote('Good evening and welcome to the 2026 awards.');

    const script = await getScript();
    expect(script.charsPerLine).toBe(32);
    expect(script.events.find((event) => event.id === eventId)?.lines.filter((line) => line.kind === 'text')).toEqual([
      { kind: 'text', text: 'Good evening and welcome to the', start: 0 },
      { kind: 'text', text: '2026 awards.', start: 32 },
    ]);
  });

  test('SCR-5 a local view gets the script built with its own options', async () => {
    const script = await getScript('?charsPerLine=20&heading=cue');
    const event = script.events.find((candidate) => candidate.id === eventId);
    expect(script.charsPerLine).toBe(20);
    expect(event?.lines.find((line) => line.kind === 'heading')).toEqual({
      kind: 'heading',
      text: (rundown.entries[eventId] as { cue: string }).cue,
    });
    expect(event?.lines.find((line) => line.kind === 'text')).toEqual({
      kind: 'text',
      text: 'Good evening and',
      start: 0,
    });
  });

  test('SCR-6 an edit tells screens to refetch, without sending the script, and raises the revision', async () => {
    const before = await getScript();
    const messages: { tag: string; payload: unknown }[] = [];
    const socket = new WebSocket(`${server.baseUrl.replace('http', 'ws')}/ws`);
    socket.on('message', (data) => messages.push(JSON.parse((data as Buffer).toString())));
    await new Promise((resolve) => socket.once('open', resolve));

    await editNote('A new script');

    await vi.waitFor(() => {
      expect(messages).toContainEqual({
        tag: MessageTag.Refetch,
        payload: { target: RefetchKey.Teleprompter, revision: null, rundownId: undefined },
      });
    });
    expect(JSON.stringify(messages)).not.toContain('A new script');
    socket.close();

    const after = await getScript();
    expect(after.revision).toBe(before.revision + 1);
    expect(JSON.stringify(after)).toContain('A new script');
  });

  test('SCR-6 an edit which leaves every line as it was keeps the revision and the ETag', async () => {
    const response = await server.get('/data/teleprompter/script');
    const before: TeleprompterScript = await response.json();
    const etag = response.headers.get('etag')!;
    const messages: { tag: string; payload: { target?: string } }[] = [];
    const socket = new WebSocket(`${server.baseUrl.replace('http', 'ws')}/ws`);
    socket.on('message', (data) => messages.push(JSON.parse((data as Buffer).toString())));
    await new Promise((resolve) => socket.once('open', resolve));

    for (const patch of [{ duration: 15 * 60_000 }, { colour: '#ff7300' }]) {
      messages.length = 0;
      const edit = await server.send('PUT', `/data/rundowns/${rundown.id}/entry`, { id: eventId, ...patch });
      expect(edit.ok).toBe(true);
      // screens cannot tell which edits change the lines, so they refetch and the rebuild finds nothing new
      await vi.waitFor(() => {
        expect(messages.some((message) => message.payload?.target === RefetchKey.Teleprompter)).toBe(true);
      });

      // fetch asks past caches when given If-None-Match, unless the request sets its own Cache-Control
      const unchanged = await server.request('/data/teleprompter/script', {
        headers: { 'If-None-Match': etag, 'Cache-Control': 'max-age=0' },
      });
      expect(unchanged.status).toBe(304);
    }
    socket.close();

    expect(await getScript()).toEqual(before);
  });

  test('SET-1 the project holds the settings, which shape the shared script', async () => {
    const viewSettings = await (await server.get('/data/view-settings')).json();
    expect(viewSettings.teleprompter).toEqual({
      script: 'note',
      charsPerLine: 32,
      heading: 'title',
      showGroups: true,
      hideEmpty: true,
      followLoaded: true,
    });

    const teleprompter = { ...viewSettings.teleprompter, script: 'title', heading: 'none', followLoaded: false };
    const response = await server.send('POST', '/data/view-settings', { ...viewSettings, teleprompter });
    expect(response.ok).toBe(true);

    await vi.waitFor(async () => {
      const event = (await getScript()).events.find((candidate) => candidate.id === eventId);
      expect(event?.lines.map((line) => line.kind)).toEqual(['group', 'text', 'blank']);
      expect(event?.lines[1]).toEqual({
        kind: 'text',
        text: (rundown.entries[eventId] as { title: string }).title,
        start: 0,
      });
    });

    // kept with the project, through a restart
    await server.stop();
    server = await startTestServer();
    expect((await (await server.get('/data/view-settings')).json()).teleprompter).toEqual(teleprompter);
  }, 15_000);
});
