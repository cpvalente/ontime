import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';

import { inject } from 'vitest';

// resolved by getAppDataPath() when the setup module is first imported
process.env.ONTIME_DATA = mkdtempSync(join(inject('testDataRoot'), 'data-'));
