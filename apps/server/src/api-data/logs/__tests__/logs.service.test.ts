import * as logger from '../logs.service.js';

// the logger mirrors every entry to stdout, silence it to keep the test output readable
vi.mock('../../../utils/console.js', () => ({
  consoleError: vi.fn(),
  consoleSubdued: vi.fn(),
}));

describe('logger', () => {
  const sessionLog = { append: vi.fn() };
  const writtenTexts = () => sessionLog.append.mock.calls.map(([log]) => log.text);

  beforeEach(() => {
    logger.shutdown();
    sessionLog.append.mockClear();
  });

  it('writes entries to the session log, including those logged before it opened', () => {
    logger.info('test', 'Before the file opened');

    logger.init(sessionLog);
    logger.info('test', 'After the file opened');

    expect(writtenTexts()).toEqual(['Before the file opened', 'After the file opened']);
  });

  it('writes the message followed by its fields, leaving out absent and empty ones', () => {
    logger.init(sessionLog);

    logger.warning('test', 'Restore skipped', { reason: 'stale', rundown: '', cue: undefined, failures: 4 });

    expect(writtenTexts()).toEqual(['Restore skipped reason=stale failures=4']);
  });

  it('quotes values which would break splitting a line by field', () => {
    logger.init(sessionLog);

    logger.info('test', 'Automation sent', { title: 'House "main" lights' });

    expect(writtenTexts()).toEqual(['Automation sent title="House \\"main\\" lights"']);
  });
});
