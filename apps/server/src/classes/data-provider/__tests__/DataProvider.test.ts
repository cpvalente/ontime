import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { makeNewProject } from '../../../models/dataModel.js';
import { flushPendingWrites, getDataProvider, initPersistence } from '../DataProvider.js';

// persistence is disabled in tests, this suite exercises it against real files
// lowdb also keeps data in memory under NODE_ENV=test
vi.mock('../../../setup/environment.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../setup/environment.js')>()),
  isTest: false,
}));

describe('initPersistence()', () => {
  let dir: string;
  const nodeEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    process.env.NODE_ENV = 'production';
    dir = await mkdtemp(join(tmpdir(), 'ontime-data-provider-'));
  });

  afterEach(async () => {
    await flushPendingWrites();
    await rm(dir, { recursive: true, force: true });
    process.env.NODE_ENV = nodeEnv;
  });

  it('saves changes still waiting to be written before switching to another project', async () => {
    const previous = join(dir, 'previous.json');
    await initPersistence(previous, makeNewProject());
    await getDataProvider().setProjectData({ title: 'edited just before switching' });

    await initPersistence(join(dir, 'next.json'), makeNewProject());

    const saved = JSON.parse(await readFile(previous, 'utf-8'));
    expect(saved.project.title).toBe('edited just before switching');
  });
});
