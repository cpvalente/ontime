import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import * as logger from '../../../api-data/logs/logs.service.js';
import { systemInfo } from '../../../setup/environment.js';
import { publicDir } from '../../../setup/index.js';
import { findCrashReport, recordCrash, sendCrashToCloud } from '../crash.service.js';

// the logger mirrors crashes to stderr, silence it to keep the test output readable
vi.mock('../../../utils/console.js', () => ({
  consoleError: vi.fn(),
  consoleSubdued: vi.fn(),
}));

const crashLine = /SEVERE SERVER Uncaught exception error=boom report=crash-report-\S+\.json$/;

beforeEach(() => {
  logger.shutdown();
  rmSync(publicDir.crashDir, { recursive: true, force: true });
});

describe('recordCrash()', () => {
  it('writes a report which holds the crash line naming it, and the system it ran in', () => {
    const sessionLog = { append: vi.fn() };
    // the electron dialog blocks until dismissed, by then the report must exist
    const escalate = vi.fn(() => readdirSync(publicDir.crashDir));
    logger.init(sessionLog, escalate);

    const report = recordCrash('Uncaught exception', new Error('boom'));

    const [fileName] = readdirSync(publicDir.crashDir);
    expect(JSON.parse(readFileSync(join(publicDir.crashDir, fileName), 'utf-8'))).toEqual(report);
    expect(report).toMatchObject({ systemInfo, data: publicDir.root, error: { message: 'boom' } });
    expect(report.log.at(-1)).toMatch(crashLine);
    expect(report.log.at(-1)).toContain(fileName);
    expect(sessionLog.append).toHaveBeenLastCalledWith(
      expect.objectContaining({ text: expect.stringContaining(fileName) }),
    );
    expect(escalate).toHaveBeenCalledWith(expect.stringContaining(fileName), true);
    expect(escalate).toHaveReturnedWith([fileName]);
  });

  it('includes entries logged before the session log opened', () => {
    logger.info('SERVER', 'Before the session log opened');

    const report = recordCrash('Uncaught exception', new Error('boom'));

    expect(report.log).toEqual([
      expect.stringContaining('Before the session log opened'),
      expect.stringMatching(crashLine),
    ]);
  });

  it('keeps only the newest reports', () => {
    mkdirSync(publicDir.crashDir, { recursive: true });
    for (let i = 0; i < 10; i++) {
      const file = join(publicDir.crashDir, `crash-log-old-${i}.log`);
      writeFileSync(file, '{}');
      utimesSync(file, 1000 + i, 1000 + i);
    }

    recordCrash('Uncaught exception', new Error('boom'));

    const reports = readdirSync(publicDir.crashDir);
    expect(reports).toHaveLength(10);
    expect(reports).not.toContain('crash-log-old-0.log');
  });
});

describe('findCrashReport()', () => {
  it('names the newest report written since a time', () => {
    const before = Date.now() - 1000;
    recordCrash('Uncaught exception', new Error('boom'));
    const [fileName] = readdirSync(publicDir.crashDir);

    expect(findCrashReport(before)).toBe(fileName);
    expect(findCrashReport(Date.now() + 1000)).toBeUndefined();
  });

  it('finds nothing when nothing has crashed', () => {
    expect(existsSync(publicDir.crashDir)).toBe(false);
    expect(findCrashReport(0)).toBeUndefined();
  });
});

describe('sendCrashToCloud()', () => {
  const fetchMock = vi.fn();
  const report = recordCrash('Uncaught exception', new Error('boom'));

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('sends nothing from other hosts, or when no collector is set', async () => {
    await sendCrashToCloud(report, { isCloud: false, url: 'http://collector.test/crash' });
    await sendCrashToCloud(report, { isCloud: true, url: undefined });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the crash without user data', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await sendCrashToCloud(report, { isCloud: true, url: 'http://collector.test/crash' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://collector.test/crash');
    expect(Object.keys(JSON.parse(init.body)).sort()).toEqual(
      ['error', 'instance', 'log', 'systemInfo', 'time', 'version'].sort(),
    );
  });

  it('resolves when the collector fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    await expect(
      sendCrashToCloud(report, { isCloud: true, url: 'http://collector.test/crash' }),
    ).resolves.toBeUndefined();

    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    await expect(
      sendCrashToCloud(report, { isCloud: true, url: 'http://collector.test/crash' }),
    ).resolves.toBeUndefined();
  });

  it('gives up on a collector which does not answer', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(init.signal?.reason))),
    );

    const sending = sendCrashToCloud(report, { isCloud: true, url: 'http://collector.test/crash' });
    await vi.advanceTimersByTimeAsync(2_000);

    await expect(sending).resolves.toBeUndefined();
  });
});
