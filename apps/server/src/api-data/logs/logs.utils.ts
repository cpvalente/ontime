import { Instant, Log, LogLevel } from 'ontime-types';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

export type LogLine = Pick<Log, 'at' | 'level' | 'origin' | 'text'>;

/**
 * Formats an entry as one line of the log file
 * eg: 2026-10-11T20:14:03.120+02:00 WARN AUTOMATION HTTP send failed target=http://10.0.0.5/cue status=500
 */
export function formatLogLine(log: LogLine): string {
  // entries may carry line breaks from error messages, one entry is always one line
  return `${toLocalIsoString(log.at)} ${log.level} ${log.origin} ${log.text.replace(/\r?\n/g, ' ')}\n`;
}

/** reads a line written by formatLogLine, its position in the file is its id */
export function parseLogLine(line: string, offset: number): Log | null {
  const match = line.match(/^(\S+) (\S+) (\S+) (.*)$/);
  if (!match) return null;
  const [, iso, level, origin, text] = match;
  return {
    id: String(offset),
    at: Date.parse(iso) as Instant,
    // the time of day at the server, as the line was written
    time: iso.slice(11, 19),
    level: level as LogLevel,
    origin,
    text,
  };
}

/** ISO 8601 in the server's timezone, users search the times they saw on the clock */
function toLocalIsoString(at: number): string {
  const offsetMinutes = -new Date(at).getTimezoneOffset();
  const local = new Date(at + offsetMinutes * MILLIS_PER_MINUTE).toISOString().slice(0, -1);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
  return `${local}${sign}${hours}:${minutes}`;
}
