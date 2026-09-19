import { logger } from '../Logger.js';

vi.mock('../../adapters/WebsocketAdapter.js', () => ({
  socket: { sendAsJson: vi.fn() },
}));

// the logger mirrors every entry to stdout, silence it to keep the test output readable
vi.mock('../../utils/console.js', () => ({
  consoleError: vi.fn(),
  consoleSubdued: vi.fn(),
  consoleSuccess: vi.fn(),
  consoleHighlight: vi.fn(),
}));

describe('logger queue', () => {
  beforeEach(() => {
    // dump empties the queue
    logger.dump();
  });

  it('keeps the newest entries once the queue is full', () => {
    for (let i = 0; i < 150; i++) {
      logger.info('test', `message ${i}`);
    }

    const queue = logger.dump();

    expect(queue.length).toBe(100);
    // the most recent entry must survive
    expect(queue.at(-1)?.text).toBe('message 149');
    // ... and the oldest ones must have been evicted
    expect(queue.at(0)?.text).toBe('message 50');
    expect(queue.some((log) => log.text === 'message 0')).toBe(false);
  });
});
