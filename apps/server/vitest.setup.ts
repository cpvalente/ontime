import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';

const testRoot = process.env.ONTIME_TEST_ROOT;
if (!testRoot) {
  throw new Error('ONTIME_TEST_ROOT is not set, is vitest.global-setup.ts running?');
}

// resolved by getAppDataPath() when the setup module is first imported
process.env.ONTIME_DATA = mkdtempSync(join(testRoot, 'data-'));
