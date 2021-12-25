import { useSocket } from './socketContext';
import { createContext, useCallback, useEffect, useState } from 'react';
import { generateId } from 'ontime-server/utils/generate_id';
import { nowInMillis, stringFromMillis } from 'ontime-server/utils/time';

export const LoggingContext = createContext({
  logData: [],
  emitInfo: () => undefined,
  emitWarning: () => undefined,
  emitError: () => undefined,
  clearLog: () => undefined
});

export const LoggingProvider = (props) => {
  const MAX_MESSAGES = 100;
  const socket = useSocket();
  const [logData, setLogData] = useState([]);
  const origin = 'USER';

  // handle incoming messages
  useEffect(() => {
    if (socket == null) return;

    // Ask for log data
    socket.emit('get-logger');

    socket.on('logger', (data) => {
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
  const _send = useCallback((text, level) => {
    if (socket != null) {
      const m = {
        id: generateId(),
        origin,
        time: stringFromMillis(nowInMillis()),
        level,
        text
      }
      setLogData((l) => [m, ...l]);
      socket.emit('logger', m);
    }
    if (logData.length > MAX_MESSAGES) {
      setLogData((l) => l.pop());
    }
  },[logData, socket]);

  /**
   * Sends a message with level INFO
   * @param text
   */
  const emitInfo = useCallback((text) => {
    _send(text, 'INFO');
  }, [_send]);

  /**
   * Sends a message with level WARN
   * @param text
   */
  const emitWarning = useCallback((text) => {
    _send(text, 'WARN');
  }, [_send]);

  /**
   * Sends a message with level ERROR
   * @param text
   */
  const emitError = useCallback((text) => {
    _send(text, 'ERROR');
  }, [_send]);

  /**
   * Clears running log
   */
  const clearLog = useCallback(() => {
    setLogData([])
  }, []);

  return (
    <LoggingContext.Provider value = {{ emitInfo, logData, emitWarning, emitError, clearLog }}>
      {props.children}
    </LoggingContext.Provider>
  )
}