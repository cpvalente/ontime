import * as logger from '../../logs/logs.service.js';
import { reportSendFailure, reportSendSuccess } from '../clients/sendFailures.js';

vi.mock('../../logs/logs.service.js', () => ({
  warning: vi.fn(),
}));

describe('send failures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs the failures of a target once until it recovers', () => {
    reportSendFailure('repeat:8000', 'OSC send failed', { error: 'refused' });
    reportSendFailure('repeat:8000', 'OSC send failed', { error: 'refused' });
    reportSendFailure('repeat:8000', 'OSC send failed', { error: 'timed out' });

    expect(logger.warning).toHaveBeenCalledTimes(1);
    expect(logger.warning).toHaveBeenCalledWith('AUTOMATION', 'OSC send failed', {
      target: 'repeat:8000',
      error: 'refused',
    });
  });

  it('logs the failures of each target', () => {
    reportSendFailure('first:8000', 'OSC send failed', { error: 'refused' });
    reportSendFailure('second:8000', 'OSC send failed', { error: 'refused' });

    expect(logger.warning).toHaveBeenCalledTimes(2);
  });

  it('logs the same failure again once the target was reached in between', () => {
    reportSendFailure('recovering:8000', 'OSC send failed', { error: 'refused' });
    reportSendSuccess('recovering:8000');
    reportSendFailure('recovering:8000', 'OSC send failed', { error: 'refused' });

    expect(logger.warning).toHaveBeenCalledTimes(2);
  });
});
