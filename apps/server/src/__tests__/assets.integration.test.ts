import { startTestServer } from './testServer.js';

test('saving css with enabled turns the css override on', { timeout: 15_000 }, async () => {
  const server = await startTestServer();
  onTestFinished(() => server.stop());

  const response = await server.send('POST', '/data/assets/css', { css: 'a { color: red; }', enabled: true });

  expect(response.status).toBe(204);
  expect(await (await server.get('/data/assets/css')).text()).toBe('a { color: red; }');
  expect(await (await server.get('/data/view-settings')).json()).toMatchObject({ overrideStyles: true });
});
