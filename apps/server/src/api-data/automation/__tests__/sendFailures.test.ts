import { logger } from '../../../classes/Logger.js';
import { reportSendFailure, reportSendSuccess } from '../clients/sendFailures.js';

vi.mock('../../../classes/Logger.js', () => ({
  logger: { warning: vi.fn() },
}));

describe('send failures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs a repeated failure to the same target once', () => {
    reportSendFailure('repeat:8000', 'refused');
    reportSendFailure('repeat:8000', 'refused');

    expect(logger.warning).toHaveBeenCalledTimes(1);
  });

  it('logs a different failure, or a failure to another target', () => {
    reportSendFailure('changing:8000', 'refused');
    reportSendFailure('changing:8000', 'timed out');
    reportSendFailure('other:8000', 'timed out');

    expect(logger.warning).toHaveBeenCalledTimes(3);
  });

  it('logs the same failure again once the target was reached in between', () => {
    reportSendFailure('recovering:8000', 'refused');
    reportSendSuccess('recovering:8000');
    reportSendFailure('recovering:8000', 'refused');

    expect(logger.warning).toHaveBeenCalledTimes(2);
  });
});
