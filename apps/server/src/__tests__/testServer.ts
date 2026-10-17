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
  let stopped: Promise<void> | undefined;

  return {
    /** shuts down as the app would with this exit code, 0 by default, safe to call more than once */
    stop: (exitCode = 0) => (stopped ??= server.stopServices(exitCode)),
    socketUrl: `ws://localhost:${serverPort}/ws`,
    get: (path: string) => fetch(`${baseUrl}${path}`),
    /** for requests which are not JSON, such as file uploads */
    request: (path: string, init: RequestInit) => fetch(`${baseUrl}${path}`, init),
    send: (method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown) =>
      fetch(`${baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
  };
}

export type TestServer = Awaited<ReturnType<typeof startTestServer>>;
