import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function setup() {
  process.env.TZ = 'Europe/Copenhagen';

  // tests must never touch the user's Ontime data, each test file gets its own folder under this root
  const testRoot = mkdtempSync(join(tmpdir(), 'ontime-test-'));
  process.env.ONTIME_TEST_ROOT = testRoot;

  return () => rmSync(testRoot, { recursive: true, force: true });
}
