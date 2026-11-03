import { LogOrigin } from 'ontime-types';

import * as logger from '../../api-data/logs/logs.service.js';
import type { LogLine } from '../../api-data/logs/logs.utils.js';
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
  entries = [];
  logger.init({ append: (entry) => entries.push(entry) });
});

afterEach(() => logger.shutdown());

describe('dispatchFromAdapter()', () => {
  it('logs who sent an action which changes playback', () => {
    void dispatchFromAdapter('pause', undefined, 'ws', 'Stage manager');
    void dispatchFromAdapter('PAUSE', undefined, 'osc');

    expect(entries.map(({ origin, text }) => ({ origin, text }))).toEqual([
      { origin: LogOrigin.Api, text: 'Action received action=pause source=ws client="Stage manager"' },
      { origin: LogOrigin.Api, text: 'Action received action=pause source=osc' },
    ]);
  });

  it('does not log reads', () => {
    void dispatchFromAdapter('version', undefined, 'http');

    expect(entries).toEqual([]);
  });

  it('does not log unknown actions as received', () => {
    expect(() => dispatchFromAdapter('unknown', undefined, 'http')).toThrow('Unhandled message unknown');

    expect(entries).toEqual([]);
  });
});
