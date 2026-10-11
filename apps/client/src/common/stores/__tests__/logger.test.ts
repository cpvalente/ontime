import { Instant, Log, LogLevel, logHistorySize } from 'ontime-types';

import { addLog, addLogHistory, clearLogs, createLog, logStore } from '../logger';

function logAt(id: string, at: number): Log {
  return { id, origin: 'SERVER', at: at as Instant, time: '', level: LogLevel.Info, text: id };
}

function getLogIds() {
  return logStore.getState().logs.map((log) => log.id);
}

describe('logger store', () => {
  beforeEach(() => {
    clearLogs();
  });

  it('keeps only the newest entries', () => {
    for (let i = 0; i < logHistorySize + 10; i++) {
      addLog(logAt(String(i), i));
    }

    const ids = getLogIds();
    expect(ids).toHaveLength(logHistorySize);
    expect(ids[0]).toBe(String(logHistorySize + 9));
  });

  it('adds the server history to what the client already has, newest first and without duplicates', () => {
    const local = createLog('CLIENT', LogLevel.Warn, 'connection lost');
    addLog(logAt('seen', 2));
    addLog({ ...local, at: 3 as Instant });

    addLogHistory([logAt('before', 1), logAt('seen', 2), logAt('after', 4)]);

    expect(getLogIds()).toEqual(['after', local.id, 'seen', 'before']);
  });
});
