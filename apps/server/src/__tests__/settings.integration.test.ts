import type { Settings } from 'ontime-types';

import { type TestServer, startTestServer } from './testServer.js';

describe('settings', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer();
  }, 15_000);

  afterAll(async () => {
    await server?.stop();
  });

  async function getSettings(): Promise<Settings> {
    return (await server.get('/data/settings')).json();
  }

  test('a patch changes only the fields it holds', async () => {
    const before = await getSettings();
    const response = await server.send('PATCH', '/data/settings', { timeFormat: '12' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...before, timeFormat: '12' });
    expect(await getSettings()).toEqual({ ...before, timeFormat: '12' });
  });

  test('two panels saving in turn keep each other’s changes', async () => {
    await server.send('PATCH', '/data/settings', { language: 'de' });
    await server.send('PATCH', '/data/settings', { auxTimerNames: ['Speaker'] });

    expect((await getSettings()).language).toBe('de');
  });

  test('rundown defaults are kept with the project', async () => {
    const rundownDefaults = { ...(await getSettings()).rundownDefaults, duration: 300_000, linkPrevious: false };
    await server.send('PATCH', '/data/settings', { rundownDefaults });

    await server.stop();
    server = await startTestServer();

    expect((await getSettings()).rundownDefaults).toEqual(rundownDefaults);
  }, 15_000);

  test('rejects an invalid patch without changing the settings', async () => {
    const before = await getSettings();
    const response = await server.send('PATCH', '/data/settings', {
      language: 'fr',
      timeFormat: '13',
      version: '0.0.0',
    });

    expect(response.status).toBe(422);
    expect(await getSettings()).toEqual(before);
  });

  test('new entries from any client take the project rundown defaults', async () => {
    const rundownDefaults = { ...(await getSettings()).rundownDefaults, duration: 420_000, linkPrevious: false };
    await server.send('PATCH', '/data/settings', { rundownDefaults });
    const rundown = await (await server.get('/data/rundowns/current')).json();

    const response = await server.send('POST', `/data/rundowns/${rundown.id}/entry`, { type: 'event' });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ duration: 420_000 });
  });
});
