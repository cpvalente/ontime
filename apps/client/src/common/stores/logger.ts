import { Instant, Log, LogLevel, LogOrigin } from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { nowInMillis } from '../utils/time';

const maxLocalLogs = 50;

type LogStore = {
  logs: Log[];
};

const logStore = createStore<LogStore>(() => ({
  logs: [],
}));

export const useLogData = () => useStore(logStore);

export const addLog = (log: Log) =>
  logStore.setState((state) => ({
    logs: [log, ...state.logs].slice(0, maxLocalLogs),
  }));

export function createLog(level: LogLevel, text: string): Log {
  return {
    id: generateId(),
    origin: LogOrigin.Client,
    at: Date.now() as Instant,
    time: millisToString(nowInMillis()),
    level,
    text,
  };
}
