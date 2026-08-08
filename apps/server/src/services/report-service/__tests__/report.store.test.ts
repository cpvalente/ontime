import type { ShowRun } from 'ontime-types';
import { vi } from 'vitest';

// in-memory stand-in for the JSON file on disk, keyed by path
const files = new Map<string, unknown>();

vi.mock('lowdb/node', () => {
  class JSONFile {
    private path: string;
    constructor(path: string) {
      this.path = path;
    }
    async read() {
      return files.has(this.path) ? files.get(this.path) : null;
    }
    async write(data: unknown) {
      files.set(this.path, data);
    }
  }
  return { JSONFile };
});

vi.mock('../../../utils/fileManagement.js', async () => {
  const actual = await vi.importActual<typeof import('../../../utils/fileManagement.js')>(
    '../../../utils/fileManagement.js',
  );
  return {
    ...actual,
    deleteFile: vi.fn(async (path: string) => {
      files.delete(path);
    }),
    dockerSafeRename: vi.fn(async (oldPath: string, newPath: string) => {
      if (files.has(oldPath)) {
        files.set(newPath, files.get(oldPath));
        files.delete(oldPath);
      }
    }),
    statIfExists: vi.fn(async (path: string) => (files.has(path) ? {} : null)),
  };
});

const {
  loadReports,
  getRuns,
  getRun,
  upsertRun,
  upsertRuns,
  deleteRun,
  deleteRunsForRundown,
  deleteAllRuns,
  deleteReportsForProject,
  renameReportsForProject,
  resetStore,
  getPathToReports,
} = await import('../report.store.js');

function makeRun(patch: Partial<ShowRun> = {}): ShowRun {
  return {
    id: 'run-1',
    rundownId: 'rundown-1',
    rundownTitle: 'My rundown',
    label: '2026-08-08',
    startedAt: 1000,
    endedAt: 2000,
    report: {},
    summary: {
      eventsRun: 0,
      eventsPlanned: 0,
      scheduledDuration: 0,
      actualDuration: 0,
      drift: 0,
      eventsOver: 0,
      eventsUnder: 0,
      eventsOnTime: 0,
      worstOverrun: null,
    },
    ...patch,
  };
}

beforeEach(() => {
  files.clear();
  resetStore();
});

describe('loadReports()', () => {
  it('starts empty for a project with no sidecar', async () => {
    const result = await loadReports('project-a');
    expect(result.runs).toEqual([]);
    expect(getRuns()).toEqual([]);
  });

  it('loads runs already on disk', async () => {
    files.set(getPathToReports('project-a'), { runs: [makeRun()] });
    const result = await loadReports('project-a');
    expect(result.runs).toHaveLength(1);
    expect(getRuns()[0].id).toBe('run-1');
  });

  it('discards a corrupt sidecar rather than throwing', async () => {
    files.set(getPathToReports('project-a'), { runs: 'not-an-array' });
    const result = await loadReports('project-a');
    expect(result.runs).toEqual([]);
  });

  it('scopes runs to the loaded project', async () => {
    files.set(getPathToReports('project-a'), { runs: [makeRun({ id: 'a' })] });
    files.set(getPathToReports('project-b'), { runs: [makeRun({ id: 'b' })] });

    await loadReports('project-a');
    expect(getRuns().map((run) => run.id)).toEqual(['a']);

    await loadReports('project-b');
    expect(getRuns().map((run) => run.id)).toEqual(['b']);
  });
});

describe('upsertRun() / getRun() / getRuns()', () => {
  beforeEach(async () => {
    await loadReports('project-a');
  });

  it('inserts a new run at the front of the list', async () => {
    await upsertRun(makeRun({ id: 'first' }));
    await upsertRun(makeRun({ id: 'second' }));
    expect(getRuns().map((run) => run.id)).toEqual(['second', 'first']);
  });

  it('replaces an existing run in place rather than duplicating it', async () => {
    await upsertRun(makeRun({ id: 'run-1', label: 'first pass' }));
    await upsertRun(makeRun({ id: 'run-1', label: 'renamed' }));

    expect(getRuns()).toHaveLength(1);
    expect(getRun('run-1')?.label).toBe('renamed');
  });

  it('persists to disk', async () => {
    await upsertRun(makeRun());
    const reloaded = await loadReports('project-a');
    expect(reloaded.runs).toHaveLength(1);
  });
});

describe('upsertRuns()', () => {
  beforeEach(async () => {
    await loadReports('project-a');
  });

  it('applies several runs in a single write', async () => {
    await upsertRuns([makeRun({ id: 'a' }), makeRun({ id: 'b' })]);

    expect(getRuns().map((run) => run.id)).toEqual(['b', 'a']);
    const written = files.get(getPathToReports('project-a')) as { runs: ShowRun[] };
    expect(written.runs).toHaveLength(2);
  });

  it('mixes inserts and replacements', async () => {
    await upsertRun(makeRun({ id: 'existing', label: 'before' }));
    await upsertRuns([makeRun({ id: 'existing', label: 'after' }), makeRun({ id: 'fresh' })]);

    expect(getRuns()).toHaveLength(2);
    expect(getRun('existing')?.label).toBe('after');
  });

  it('does not write when given nothing to do', async () => {
    await upsertRun(makeRun({ id: 'a' }));
    await upsertRuns([]);

    expect(getRuns()).toHaveLength(1);
  });
});

describe('deleteRun()', () => {
  beforeEach(async () => {
    await loadReports('project-a');
    await upsertRun(makeRun({ id: 'keep' }));
    await upsertRun(makeRun({ id: 'discard' }));
  });

  it('removes only the targeted run', async () => {
    const didDelete = await deleteRun('discard');
    expect(didDelete).toBe(true);
    expect(getRuns().map((run) => run.id)).toEqual(['keep']);
  });

  it('reports false for a run that does not exist', async () => {
    expect(await deleteRun('missing')).toBe(false);
    expect(getRuns()).toHaveLength(2);
  });
});

describe('deleteRunsForRundown()', () => {
  it('removes only runs belonging to the given rundown', async () => {
    await loadReports('project-a');
    await upsertRun(makeRun({ id: 'a', rundownId: 'rundown-x' }));
    await upsertRun(makeRun({ id: 'b', rundownId: 'rundown-y' }));
    await upsertRun(makeRun({ id: 'c', rundownId: 'rundown-x' }));

    const removed = await deleteRunsForRundown('rundown-x');

    expect(removed).toBe(2);
    expect(getRuns().map((run) => run.id)).toEqual(['b']);
  });
});

describe('deleteAllRuns()', () => {
  it('empties the run history', async () => {
    await loadReports('project-a');
    await upsertRun(makeRun());
    await deleteAllRuns();
    expect(getRuns()).toEqual([]);
  });
});

describe('project lifecycle', () => {
  it('deletes the sidecar for a project', async () => {
    await loadReports('project-a');
    await upsertRun(makeRun());
    expect(files.has(getPathToReports('project-a'))).toBe(true);

    await deleteReportsForProject('project-a');
    expect(files.has(getPathToReports('project-a'))).toBe(false);
  });

  it('does nothing when the project never had a sidecar', async () => {
    await expect(deleteReportsForProject('never-loaded')).resolves.toBeUndefined();
  });

  it('moves the sidecar to follow a project rename', async () => {
    await loadReports('project-a');
    await upsertRun(makeRun());

    await renameReportsForProject('project-a', 'project-b');

    expect(files.has(getPathToReports('project-a'))).toBe(false);
    const moved = files.get(getPathToReports('project-b')) as { runs: ShowRun[] };
    expect(moved.runs).toHaveLength(1);
  });

  it('does nothing when renaming a project that never had a sidecar', async () => {
    await expect(renameReportsForProject('never-loaded', 'still-never-loaded')).resolves.toBeUndefined();
  });
});
