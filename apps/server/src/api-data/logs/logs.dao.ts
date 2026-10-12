import { appendFileSync, closeSync, existsSync, openSync, readSync, renameSync, statSync } from 'node:fs';

import { Log, LogLevel, LogOrigin } from 'ontime-types';

import { type LogLine, formatLogLine, parseLogLine } from './logs.utils.js';

/** a session which floods its log stops writing past this size */
const maxFileSize = 5 * 1024 * 1024;

/** a reader gets the newest entries which fit in this size, about a thousand */
const maxBytesPerRead = 128 * 1024;

export type SessionLog = ReturnType<typeof createSessionLog>;

/**
 * Starts a log file for this session, keeping the previous session's file
 * Synchronous writes avoid leaving asynchronous appends pending when the process exits
 */
export function createSessionLog(file: string, previousFile: string, maxSize = maxFileSize) {
  let size = 0;
  let isTruncated = false;

  try {
    if (existsSync(file)) {
      renameSync(file, previousFile);
    }
  } catch (_error) {
    // the session log is a diagnostic, it must never stop the server
  }

  function write(line: string) {
    try {
      appendFileSync(file, line);
      size += Buffer.byteLength(line);
    } catch (_error) {
      // the session log is a diagnostic, it must never stop the server
    }
  }

  return {
    append(log: LogLine) {
      if (isTruncated) {
        return;
      }

      const line = formatLogLine(log);
      if (size + Buffer.byteLength(line) > maxSize) {
        isTruncated = true;
        write(
          formatLogLine({
            ...log,
            level: LogLevel.Warn,
            origin: LogOrigin.Server,
            text: `Log truncated maxBytes=${maxSize}`,
          }),
        );
        return;
      }
      write(line);
    },
  };
}

/**
 * Reads the newest entries, the full session is in the file
 * Writes are synchronous, so the file never ends in a line still being written
 */
export function readLogEntries(file: string, maxBytes = maxBytesPerRead): Log[] {
  let tail: Buffer;
  let start = 0;
  try {
    const { size } = statSync(file);
    start = Math.max(0, size - maxBytes);
    tail = Buffer.alloc(size - start);
    const fd = openSync(file, 'r');
    try {
      readSync(fd, tail, 0, tail.length, start);
    } finally {
      closeSync(fd);
    }
  } catch (_error) {
    return [];
  }

  // a read starting mid-file starts mid-line
  const firstLine = start > 0 ? tail.indexOf('\n') + 1 : 0;
  const entries: Log[] = [];
  let offset = start + firstLine;
  for (const line of tail.subarray(firstLine).toString('utf-8').split('\n')) {
    const entry = parseLogLine(line, offset);
    if (entry) entries.push(entry);
    offset += Buffer.byteLength(line) + 1;
  }
  return entries;
}
