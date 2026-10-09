import { type ProjectRundownsList, RefetchKey, type Rundown, type Settings } from 'ontime-types';

import { startTestServer, type TestServer } from './testServer.js';

type Refetch = { target: RefetchKey; rundownId?: string };

/**
 * Collects the Refetch messages the server sends to a connected client
 */
async function connectClient(server: TestServer) {
  const received: Refetch[] = [];
  const socket = new WebSocket(server.socketUrl);
  socket.addEventListener('message', (event) => {
    const { tag, payload } = JSON.parse(String(event.data));
    if (tag === 'refetch') received.push(payload);
  });
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  onTestFinished(() => socket.close());

  return {
    /** runs a write and waits for the refetches it should send */
    async expectRefetch(write: () => Promise<Response>, expected: Refetch[]) {
      received.length = 0;
      const response = await write();
      expect(response.ok, await response.clone().text()).toBe(true);
      await vi.waitFor(() => {
        for (const refetch of expected) {
          expect(received).toContainEqual(expect.objectContaining(refetch));
        }
      });
    },
  };
}

// each start loads the full server module graph, which takes a few seconds on slower machines
describe('clients are told to refetch after every write', { timeout: 15_000 }, () => {
  test('writes to project sections send the matching refetch', async () => {
    const server = await startTestServer();
    onTestFinished(() => server.stop());
    const client = await connectClient(server);

    const settings: Settings = await (await server.get('/data/settings')).json();
    await client.expectRefetch(
      () => server.send('POST', '/data/settings', { ...settings, language: 'de' }),
      [{ target: RefetchKey.Settings }],
    );

    const viewSettings = { dangerColor: '#f00', normalColor: '#fff', overrideStyles: false, warningColor: '#ff0' };
    await client.expectRefetch(
      () => server.send('POST', '/data/view-settings', viewSettings),
      [{ target: RefetchKey.ViewSettings }],
    );

    const preset = { enabled: true, alias: 'stage', target: 'timer', search: '', displayInNav: false };
    await client.expectRefetch(
      () => server.send('POST', '/data/url-presets', preset),
      [{ target: RefetchKey.UrlPresets }],
    );
    await client.expectRefetch(
      () => server.send('PUT', '/data/url-presets/stage', { ...preset, enabled: false }),
      [{ target: RefetchKey.UrlPresets }],
    );
    await client.expectRefetch(
      () => server.send('DELETE', '/data/url-presets/stage'),
      [{ target: RefetchKey.UrlPresets }],
    );

    const automationSettings = { enabledAutomations: false, enabledOscIn: false, oscPortIn: 8888 };
    await client.expectRefetch(
      () => server.send('POST', '/data/automations', automationSettings),
      [{ target: RefetchKey.Automation }],
    );

    await client.expectRefetch(
      () => server.send('PATCH', '/data/db', { project: { title: 'Patched' }, urlPresets: [] }),
      [{ target: RefetchKey.All }],
    );
  });

  test('patching a background rundown tells clients to refetch everything', async () => {
    const server = await startTestServer();
    onTestFinished(() => server.stop());
    const client = await connectClient(server);

    const created: ProjectRundownsList = await (await server.send('POST', '/data/rundowns', { title: 'Later' })).json();
    const background = created.rundowns.find((rundown) => rundown.id !== created.loaded);
    expect(background).toBeDefined();
    const rundown: Rundown = await (await server.get(`/data/rundowns/${background!.id}`)).json();

    await client.expectRefetch(
      () => server.send('PATCH', '/data/db', { rundowns: { [rundown.id]: { ...rundown, title: 'Patched' } } }),
      [{ target: RefetchKey.All }],
    );
  });
});
