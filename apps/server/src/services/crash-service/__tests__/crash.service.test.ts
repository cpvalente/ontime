import { mkdirSync, readFileSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import * as logger from '../../../api-data/logs/logs.service.js';
import { systemInfo } from '../../../setup/environment.js';
import { publicDir } from '../../../setup/index.js';
import { recordCrash } from '../crash.service.js';

// the logger mirrors crashes to stderr, silence it to keep the test output readable
vi.mock('../../../utils/console.js', () => ({
  consoleError: vi.fn(),
  consoleSubdued: vi.fn(),
}));

const crashLine = /SEVERE SERVER Uncaught exception error=boom report=crash-report-\S+\.json$/;

function readReports() {
  return readdirSync(publicDir.crashDir).map((name) => ({
    name,
    report: JSON.parse(readFileSync(join(publicDir.crashDir, name), 'utf-8')),
  }));
}

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

    recordCrash('Uncaught exception', new Error('boom'));

    const [{ name, report }] = readReports();
    expect(report).toMatchObject({
      systemInfo: { host: systemInfo.host, node: systemInfo.node },
      data: publicDir.root,
      error: { message: 'boom' },
    });
    expect(report.log.at(-1)).toMatch(crashLine);
    expect(report.log.at(-1)).toContain(name);
    expect(sessionLog.append).toHaveBeenLastCalledWith(
      expect.objectContaining({ text: expect.stringContaining(name) }),
    );
    expect(escalate).toHaveReturnedWith([name]);
  });

  it('includes entries logged before the session log opened', () => {
    logger.info('SERVER', 'Before the session log opened');

    recordCrash('Uncaught exception', new Error('boom'));

    const [{ report }] = readReports();
    expect(report.log).toEqual([
      expect.stringContaining('Before the session log opened'),
      expect.stringMatching(crashLine),
    ]);
  });

  it('keeps only the newest reports, always including the new one', () => {
    mkdirSync(publicDir.crashDir, { recursive: true });
    // dated after the crash, as when a clock is set back
    const future = Date.now() / 1000 + 3600;
    for (let i = 0; i < 10; i++) {
      const file = join(publicDir.crashDir, `crash-log-old-${i}.log`);
      writeFileSync(file, '{}');
      utimesSync(file, future + i, future + i);
    }

    recordCrash('Uncaught exception', new Error('boom'));

    const names = readdirSync(publicDir.crashDir);
    expect(names).toHaveLength(10);
    expect(names).not.toContain('crash-log-old-0.log');
    expect(names.some((name) => name.startsWith('crash-report-'))).toBe(true);
  });
});
