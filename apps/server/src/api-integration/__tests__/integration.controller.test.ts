import { LogOrigin } from 'ontime-types';

import * as logger from '../../api-data/logs/logs.service.js';
import type { LogLine } from '../../api-data/logs/logs.utils.js';
import { runtimeService } from '../../services/runtime-service/runtime.service.js';
import { dispatchFromAdapter } from '../integration.controller.js';

vi.mock('../../utils/console.js', () => ({
  consoleError: vi.fn<() => void>(),
  consoleSubdued: vi.fn<() => void>(),
}));

vi.mock('../../services/runtime-service/runtime.service.js', () => ({
  runtimeService: { pause: vi.fn<() => void>() },
}));

let entries: LogLine[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  entries = [];
  logger.init({ append: (entry) => entries.push(entry) });
});

afterEach(() => logger.shutdown());

describe('dispatchFromAdapter()', () => {
  it('logs who sent an action which changes playback', () => {
    void dispatchFromAdapter('pause', undefined, 'ws', 'Stage manager', true);
    void dispatchFromAdapter('PAUSE', undefined, 'osc', '127.0.0.1', true);

    expect(entries.map(({ origin, text }) => ({ origin, text }))).toEqual([
      { origin: LogOrigin.Api, text: 'Action received action=pause source=ws client="Stage manager"' },
      { origin: LogOrigin.Api, text: 'Action received action=pause source=osc client=127.0.0.1' },
    ]);
  });

  it('does not log reads', () => {
    void dispatchFromAdapter('version', undefined, 'http', '127.0.0.1', true);

    expect(entries).toEqual([]);
  });

  it('does not log unknown actions as received', () => {
    expect(() => dispatchFromAdapter('unknown', undefined, 'http', '127.0.0.1', true)).toThrow(
      'Unhandled message unknown',
    );

    expect(entries).toEqual([]);
  });

  it('refuses commands without write access', () => {
    expect(() => dispatchFromAdapter('pause', undefined, 'http', '127.0.0.1', false)).toThrow('Command not allowed');

    expect(runtimeService.pause).not.toHaveBeenCalled();
  });

  it.each(['version', 'poll'])('allows %s without write access', (action) => {
    expect(dispatchFromAdapter(action, undefined, 'http', '127.0.0.1', false)).toHaveProperty('payload');
  });
});
