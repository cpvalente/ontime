import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Instant, LogLevel } from 'ontime-types';

import { createSessionLog, readLogEntries } from '../logs.dao.js';

function makeLog(text: string) {
  return { at: Date.UTC(2026, 9, 11, 18, 14, 3, 120) as Instant, level: LogLevel.Warn, origin: 'AUTOMATION', text };
}

describe('session log', () => {
  let file: string;
  let previousFile: string;

  beforeEach(() => {
    const directory = mkdtempSync(join(tmpdir(), 'ontime-session-log-'));
    file = join(directory, 'ontime.log');
    previousFile = join(directory, 'ontime.previous.log');
  });

  it('keeps the previous session apart', () => {
    writeFileSync(file, '2026-10-11T22:00:00.000+02:00 INFO AUTOMATION Automation sent title=Intro\n');

    const sessionLog = createSessionLog(file, previousFile);
    sessionLog.append(makeLog('This session'));

    expect(readFileSync(previousFile, 'utf-8')).toContain('Automation sent');
    expect(readFileSync(file, 'utf-8')).not.toContain('Automation sent');
  });

  it('stops writing past its size limit, saying so once', () => {
    const sessionLog = createSessionLog(file, previousFile, 200);
    for (let i = 0; i < 10; i++) {
      sessionLog.append(makeLog(`Entry ${i}`));
    }

    const content = readFileSync(file, 'utf-8');
    expect(Buffer.byteLength(content)).toBeLessThan(300);
    expect(content.match(/Log truncated maxBytes=200/g)).toHaveLength(1);
    expect(content.trimEnd().split('\n').at(-1)).toContain('Log truncated');
  });

  it('reads the entries of this session', () => {
    const sessionLog = createSessionLog(file, previousFile);
    sessionLog.append(makeLog('Automation sent title="House lights" trigger=onFinish'));

    expect(readLogEntries(file)).toEqual([
      expect.objectContaining({
        level: LogLevel.Warn,
        origin: 'AUTOMATION',
        text: 'Automation sent title="House lights" trigger=onFinish',
        at: makeLog('').at,
      }),
    ]);
  });

  it('reads only the newest whole entries of a long session', () => {
    const sessionLog = createSessionLog(file, previousFile);
    for (let i = 0; i < 10; i++) {
      sessionLog.append(makeLog(`Entry ${i}`));
    }

    const entries = readLogEntries(file, 200);

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.length).toBeLessThan(10);
    expect(entries.at(-1)?.text).toBe('Entry 9');
    expect(entries.every((entry) => /^Entry \d$/.test(entry.text))).toBe(true);
  });
});
