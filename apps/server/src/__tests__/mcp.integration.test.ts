import { type TestServer, startTestServer } from './testServer.js';

describe.each(['', '/client-hash'])('MCP HTTP integration at %s', (prefix) => {
  let server: TestServer;

  beforeAll(async () => {
    vi.stubEnv('ROUTER_PREFIX', prefix.slice(1));
    server = await startTestServer();
  }, 15_000);

  afterAll(async () => {
    await server?.stop();
    vi.unstubAllEnvs();
  });

  async function request(id: number, method: string, params: Record<string, unknown> = {}) {
    const response = await server.request(`${prefix}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2025-06-18',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('mcp-session-id')).toBeNull();
    const body = await response.json();
    expect(body).toMatchObject({ jsonrpc: '2.0', id });
    expect(body.error).toBeUndefined();
    return body.result;
  }

  test('initializes and handles independent concurrent tool, prompt and resource requests', async () => {
    const initialized = await request(1, 'initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'ontime-test', version: '1.0.0' },
    });
    expect(initialized.serverInfo.name).toBe('ontime-mcp-server');

    const [tools, prompts, resources] = await Promise.all([
      request(2, 'tools/list'),
      request(3, 'prompts/list'),
      request(4, 'resources/list'),
    ]);
    expect(tools.tools).toContainEqual(expect.objectContaining({ name: 'ontime_get_project_info' }));
    expect(prompts.prompts).toContainEqual(expect.objectContaining({ name: 'validate_rundown' }));
    expect(resources.resources).toContainEqual(expect.objectContaining({ uri: 'ontime://schema' }));

    const [tool, prompt, resource] = await Promise.all([
      request(5, 'tools/call', { name: 'ontime_get_project_info' }),
      request(6, 'prompts/get', { name: 'validate_rundown' }),
      request(7, 'resources/read', { uri: 'ontime://schema' }),
    ]);
    expect(tool.isError).not.toBe(true);
    expect(JSON.parse(tool.content[0].text)).toHaveProperty('title');
    expect(prompt.messages[0].content.text.length).toBeGreaterThan(0);
    expect(resource.contents[0]).toMatchObject({ uri: 'ontime://schema', mimeType: 'text/markdown' });
  });

  test('styles the screens through the css override tool', async () => {
    const css = ':root { --color-override: #123456; }';
    const applied = await request(8, 'tools/call', { name: 'ontime_set_css_override', arguments: { css } });
    expect(applied.isError).not.toBe(true);
    expect(await (await server.get(`${prefix}/data/assets/css`)).text()).toBe(css);
    expect(await (await server.get(`${prefix}/data/view-settings`)).json()).toMatchObject({ overrideStyles: true });

    await request(9, 'tools/call', { name: 'ontime_set_css_override', arguments: { css, enabled: false } });
    expect(await (await server.get(`${prefix}/data/view-settings`)).json()).toMatchObject({ overrideStyles: false });
  });
});
