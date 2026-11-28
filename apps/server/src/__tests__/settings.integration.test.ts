import type { Settings } from 'ontime-types';

import { type TestServer, startTestServer } from './testServer.js';

/**
 * Settings are one object, each panel changes only its own fields
 */
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
    const response = await server.send('PATCH', '/data/settings', { timeFormat: '12', version: '0.0.0' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...before, timeFormat: '12' });
    expect(await getSettings()).toEqual({ ...before, timeFormat: '12' });
  });

  test('two panels saving in turn keep each other’s changes', async () => {
    await server.send('PATCH', '/data/settings', { language: 'de' });
    await server.send('PATCH', '/data/settings', { auxTimerNames: ['Speaker'] });

    const settings = await getSettings();
    expect(settings.language).toBe('de');
    expect(settings.auxTimerNames).toEqual(['Speaker', '', '']);
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
    const response = await server.send('PATCH', '/data/settings', { language: 'fr', timeFormat: '13' });

    expect(response.status).toBe(422);
    expect(await getSettings()).toEqual(before);
  });

  test('the whole-object POST is gone', async () => {
    const response = await server.send('POST', '/data/settings', { timeFormat: '24' });
    expect(response.status).toBe(404);
  });
});
