import { startTestServer } from './testServer.js';

test('creating a custom field with a taken label answers 409 with the reason', { timeout: 15_000 }, async () => {
  const server = await startTestServer();
  onTestFinished(() => server.stop());
  const field = { label: 'Lighting', type: 'text', colour: '' };
  expect((await server.send('POST', '/data/custom-fields', field)).status).toBe(201);

  const response = await server.send('POST', '/data/custom-fields', field);

  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ message: 'Label Lighting already exists' });
});

test('editing a custom field changes its colour without resending the type', { timeout: 15_000 }, async () => {
  const server = await startTestServer();
  onTestFinished(() => server.stop());
  expect((await server.send('POST', '/data/custom-fields', { label: 'Sound', type: 'text', colour: '' })).status).toBe(
    201,
  );

  const response = await server.send('PUT', '/data/custom-fields/Sound', { label: 'Sound', colour: '#A790F5' });

  expect(response.status).toBe(200);
  expect(await response.json()).toContainEqual({ key: 'Sound', label: 'Sound', type: 'text', colour: '#A790F5' });
});
