import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { Low } from 'lowdb';

import { makeNewProject } from '../../../models/dataModel.js';
import { flushPendingWrites, getDataProvider, getFileToRead, initPersistence } from '../DataProvider.js';

describe('saving pending changes of the loaded project', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'ontime-data-provider-'));
  });

  afterEach(async () => {
    await flushPendingWrites();
    await rm(dir, { recursive: true, force: true });
  });

  it('saves changes still waiting to be written before switching to another project', async () => {
    const previous = join(dir, 'previous.json');
    await initPersistence(previous, makeNewProject());
    await getDataProvider().setProjectData({ title: 'edited just before switching' });

    await initPersistence(join(dir, 'next.json'), makeNewProject());

    const saved = JSON.parse(await readFile(previous, 'utf-8'));
    expect(saved.project.title).toBe('edited just before switching');
  });

  it('includes changes still waiting to be written in the file given to read, copy or move', async () => {
    await initPersistence(join(dir, 'loaded.json'), makeNewProject());
    await getDataProvider().setProjectData({ title: 'edited just before download' });

    const saved = JSON.parse(await readFile(await getFileToRead(), 'utf-8'));
    expect(saved.project.title).toBe('edited just before download');
  });

  it('waits for a forced save already in progress before returning the file to another reader', async () => {
    await initPersistence(join(dir, 'loaded.json'), makeNewProject());
    await getDataProvider().setProjectData({ title: 'saved for both readers' });

    let releaseWrite!: () => void;
    const writeGate = new Promise<void>((resolve) => {
      releaseWrite = resolve;
    });
    const originalWrite = Low.prototype.write;
    const write = vi.spyOn(Low.prototype, 'write').mockImplementationOnce(async function () {
      await writeGate;
      await originalWrite.call(this);
    });

    const firstRead = getFileToRead();
    let secondFinished = false;
    const secondRead = getFileToRead().then((path) => {
      secondFinished = true;
      return path;
    });

    try {
      // Let ready readers finish while the filesystem write remains blocked.
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(secondFinished).toBe(false);
    } finally {
      releaseWrite();
      await Promise.all([firstRead, secondRead]);
      write.mockRestore();
    }

    const saved = JSON.parse(await readFile(await secondRead, 'utf-8'));
    expect(saved.project.title).toBe('saved for both readers');
  });
});

describe('delayed save of the loaded project', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'ontime-data-provider-'));
    await initPersistence(join(dir, 'loaded.json'), makeNewProject());
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    await flushPendingWrites();
    await rm(dir, { recursive: true, force: true });
  });

  it('writes a single change after the quiet period', async () => {
    const write = vi.spyOn(Low.prototype, 'write').mockResolvedValue();

    await getDataProvider().setProjectData({ title: 'single change' });

    await vi.advanceTimersByTimeAsync(2999);
    expect(write).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(write).toHaveBeenCalledOnce();
  });

  it('keeps writing while changes never pause', async () => {
    const write = vi.spyOn(Low.prototype, 'write').mockResolvedValue();
    const writesBySecond: number[] = [];

    for (let second = 0; second < 30; second++) {
      await getDataProvider().setProjectData({ title: `change ${second}` });
      await vi.advanceTimersByTimeAsync(1000);
      writesBySecond.push(write.mock.calls.length);
    }

    // writesBySecond[n] holds the writes made by n + 1 seconds
    expect(writesBySecond[8]).toBe(0);
    expect(writesBySecond[9]).toBe(1);
    expect(writesBySecond[19]).toBe(2);
    expect(writesBySecond[29]).toBe(3);
  });

  it('writes immediately when flushed and cancels the delayed save', async () => {
    const write = vi.spyOn(Low.prototype, 'write').mockResolvedValue();

    await getDataProvider().setProjectData({ title: 'flushed change' });
    await flushPendingWrites();
    expect(write).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(10000);
    expect(write).toHaveBeenCalledOnce();
  });
});
