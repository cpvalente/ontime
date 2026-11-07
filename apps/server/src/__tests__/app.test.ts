import { stopServices } from '../server.js';

vi.mock('../server.js', () => ({ stopServices: vi.fn(async () => {}) }));
vi.mock('../utils/console.js', () => ({
  consoleError: vi.fn(),
  consoleHighlight: vi.fn(),
  consoleSubdued: vi.fn(),
}));
// the electron crash dialog asks for a clean quit while the crash is recorded
vi.mock('../services/crash-service/crash.service.js', () => ({
  recordCrash: vi.fn(() => {
    void app.shutdown(99);
  }),
}));

let app: typeof import('../app.js');

describe('crash handling', () => {
  const events = ['uncaughtException', 'unhandledRejection', 'exit', 'SIGHUP', 'SIGINT', 'SIGTERM'] as const;
  const before = new Map(events.map((event) => [event, process.listeners(event)]));

  afterAll(() => {
    // app.ts registers process handlers when imported, they must not outlive this file
    for (const event of events) {
      for (const listener of process.listeners(event)) {
        if (!before.get(event)?.includes(listener)) process.off(event, listener);
      }
    }
  });

  it('exits as a crash when a clean shutdown is asked while it is handled', async () => {
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    app = await import('../app.js');

    const onCrash = process.listeners('uncaughtException').at(-1) as (error: Error) => Promise<void>;
    await onCrash(new Error('boom'));

    expect(stopServices).toHaveBeenCalledWith(1);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
