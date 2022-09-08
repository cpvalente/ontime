// @ts-nocheck
import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';

import { generateId } from '../utils/generate_id';
import { nowInMillis, stringFromMillis } from '../utils/time';

import { useSocket } from './socketContext';

type LOG_LEVEL = 'INFO' | 'WARN' | 'ERROR';
type Log = {
  id: string;
  origin: string;
  time: string;
  level: LOG_LEVEL;
  text: string;
};

interface LoggingProviderState {
  logData: Log[];
  emitInfo: (text: string) => void;
  emitWarning: (text: string) => void;
  emitError: (text: string) => void;
  clearLog: () => void;
}

type LoggingProviderProps = {
  children: ReactNode
}

const notInitialised = () => {
  throw new Error("Not initialised");
};

export const LoggingContext = createContext<LoggingProviderState>({
  logData: [],
  emitInfo: notInitialised,
  emitWarning: notInitialised,
  emitError: notInitialised,
  clearLog: notInitialised
});

export const LoggingProvider = ({ children }: LoggingProviderProps) => {
  const MAX_MESSAGES = 100;
  const socket = useSocket();
  const [logData, setLogData] = useState<Log[]>([]);
  const origin = 'USER';

  // handle incoming messages
  useEffect(() => {
    if (socket == null) return;

    // Ask for log data
    socket.emit('get-logger');

    socket.on('logger', (data: Log) => {
      setLogData((l) => [data, ...l]);
    });

    // Clear listener
    return () => {
      socket.off('logger');
    };
  }, [socket]);

  /**
   * Utility function sends message over socket
   * @param text
   * @param level
   * @private
   */
  const _send = useCallback(
    (text: string, level: LOG_LEVEL) => {
      if (socket != null) {
        const m: Log = {
          id: generateId(),
          origin,
          time: stringFromMillis(nowInMillis()),
          level,
          text,
        };
        setLogData((l) => [m, ...l]);
        socket.emit('logger', m);
      }
      if (logData.length > MAX_MESSAGES) {
        setLogData((l) => l.pop());
      }
    },
    [logData, socket]
  );

  /**
   * Sends a message with level INFO
   * @param text
   */
  const emitInfo = useCallback(
    (text: string) => {
      _send(text, 'INFO');
    },
    [_send]
  );

  /**
   * Sends a message with level WARN
   * @param text
   */
  const emitWarning = useCallback(
    (text: string) => {
      _send(text, 'WARN');
    },
    [_send]
  );

  /**
   * Sends a message with level ERROR
   * @param text
   */
  const emitError = useCallback(
    (text: string) => {
      _send(text, 'ERROR');
    },
    [_send]
  );

  /**
   * Clears running log
   */
  const clearLog = useCallback(() => {
    setLogData([]);
  }, []);

  return (
    <LoggingContext.Provider value={{ emitInfo, logData, emitWarning, emitError, clearLog }}>
      {children}
    </LoggingContext.Provider>
  );
};
