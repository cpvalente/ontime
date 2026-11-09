import { startTestServer } from './testServer.js';

test('deleting an automation a trigger uses answers 409 with the reason', { timeout: 15_000 }, async () => {
  const server = await startTestServer();
  onTestFinished(() => server.stop());
  const created = await server.send('POST', '/data/automations/automation', {
    title: 'House lights',
    filterRule: 'all',
    filters: [],
    outputs: [],
  });
  expect(created.status).toBe(201);
  const { id } = await created.json();
  const trigger = { title: 'Show start', trigger: 'onStart', automationId: id };
  expect((await server.send('POST', '/data/automations/trigger', trigger)).status).toBe(201);

  const response = await server.send('DELETE', `/data/automations/automation/${id}`);

  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ message: 'Unable to delete automation used in trigger Show start' });
});
