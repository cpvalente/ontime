import { runtimeStorePlaceholder } from 'ontime-types';

import * as logger from '../../logs/logs.service.js';
import { emitHTTP } from '../clients/http.client.js';

vi.mock('../../logs/logs.service.js', () => ({
  warning: vi.fn(),
}));

describe('emitHTTP()', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs a failure by its origin and error code, never the path or query which may carry credentials', async () => {
    const failure = new TypeError('fetch failed for http://10.0.0.5/hooks/secret?token=secret', {
      cause: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure));

    emitHTTP({ type: 'http', url: 'http://10.0.0.5/hooks/secret?token=secret' }, runtimeStorePlaceholder);

    await vi.waitFor(() => expect(logger.warning).toHaveBeenCalled());
    expect(logger.warning).toHaveBeenCalledWith('AUTOMATION', 'HTTP send failed', {
      target: 'http://10.0.0.5',
      error: 'TypeError',
      code: 'ECONNREFUSED',
    });
  });
});
