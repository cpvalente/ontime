/**
 * Starts a real Ontime server in-process, on a free port, against the test file's data folder
 * Every call loads a fresh module graph, so starting again after stop() behaves like an app restart
 */
export async function startTestServer() {
  process.env.PORT = '0';
  vi.resetModules();

  const server = await import('../server.js');
  await server.initAssets();
  const { serverPort } = await server.startServer();
  const baseUrl = `http://localhost:${serverPort}`;

  return {
    /** same as a clean shutdown: flushes pending writes and clears the restore point */
    stop: () => server.stopServices(0),
    get: (path: string) => fetch(`${baseUrl}${path}`),
    send: (method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown) =>
      fetch(`${baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
  };
}

export type TestServer = Awaited<ReturnType<typeof startTestServer>>;
