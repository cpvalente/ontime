import { Mock } from 'vitest';

import { parseDatabaseModel } from '../../../api-data/db/db.parser.js';
import { makeOntimeEvent, makeRundown } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
import { rundownCache } from '../../../api-data/rundown/rundown.dao.js';
import { initRundown } from '../../../api-data/rundown/rundown.service.js';
import { getDataProvider } from '../../../classes/data-provider/DataProvider.js';
import { makeNewProject } from '../../../models/dataModel.js';
import { isLastLoadedProject } from '../../app-state-service/AppStateService.js';
import { auxTimerService } from '../../aux-timer-service/AuxTimerService.js';
import {
  deleteProjectFile,
  duplicateProjectFile,
  loadProjectFile,
  patchCurrentProject,
  renameProjectFile,
} from '../ProjectService.js';
import { doesProjectExist, parseJsonFile } from '../projectServiceUtils.js';

// stop the database loading from initiating
vi.mock('../../../setup/loadDb.js', () => {
  return {
    switchDb: vi.fn(),
  };
});

vi.mock('../../app-state-service/AppStateService.js', () => ({
  isLastLoadedProject: vi.fn(),
  setLastLoaded: vi.fn(),
}));

vi.mock('../projectServiceUtils.js', () => ({
  doesProjectExist: vi.fn(),
  getPathToProject: vi.fn(),
  parseJsonFile: vi.fn(),
}));

vi.mock('../../../api-data/db/db.parser.js', () => ({
  parseDatabaseModel: vi.fn(),
}));

vi.mock('../../../api-data/rundown/rundown.service.js', () => ({
  initRundown: vi.fn(),
}));

vi.mock('../../../classes/data-provider/DataProvider.js', () => ({
  initPersistence: vi.fn(),
  getDataProvider: vi.fn(),
}));

vi.mock('../../runtime-service/runtime.service.js', () => ({
  runtimeService: { stop: vi.fn() },
}));

vi.mock('../../aux-timer-service/AuxTimerService.js', () => ({
  auxTimerService: { loadNames: vi.fn() },
}));

/**
 * tests only assert errors since the
 * controller depend on these to send the right responses
 */
describe('deleteProjectFile', () => {
  it('throws an error if the project file does not exist', async () => {
    (isLastLoadedProject as Mock).mockResolvedValue(false);
    (doesProjectExist as Mock).mockReturnValue(null);
    await expect(deleteProjectFile('nonexistentProject')).rejects.toThrow('Project file not found');
  });
});

describe('duplicateProjectFile', () => {
  it('throws an error if origin project does not exist', async () => {
    (doesProjectExist as Mock).mockReturnValue(null);
    await expect(duplicateProjectFile('does not exist', 'doesnt matter')).rejects.toThrow('Project file not found');
  });

  it('throws an error if new file name is already a project', async () => {
    // current project exists
    (doesProjectExist as Mock).mockReturnValueOnce('thisoneexists');
    // new project exists
    (doesProjectExist as Mock).mockReturnValueOnce('existingproject');
    await expect(duplicateProjectFile('thisoneexists', 'existingproject')).rejects.toThrow(
      'Project file with name existingproject already exists',
    );
  });
});

describe('renameProjectFile', () => {
  it('throws an error if origin project does not exist', async () => {
    (doesProjectExist as Mock).mockReturnValue(null);
    await expect(renameProjectFile('does not exist', 'doesnt matter')).rejects.toThrow('Project file not found');
  });

  it('throws an error if new file name is already a project', async () => {
    // current project exists
    (doesProjectExist as Mock).mockReturnValueOnce('this one exists');
    // new project exists
    (doesProjectExist as Mock).mockReturnValueOnce('existingproject');
    await expect(renameProjectFile('this one exists', 'existingproject')).rejects.toThrow(
      'Project file with name existingproject already exists',
    );
  });
});

describe('loadProjectFile', () => {
  it('applies the aux timer names of the loaded project', async () => {
    // the aux timers are long lived singletons, so loading a project must push the new names onto them
    // otherwise the editor and views keep showing the previous project's names
    const rundown = { id: 'default', title: '', order: [], flatOrder: [], entries: {}, revision: 0 };
    (doesProjectExist as Mock).mockReturnValue('/projects/show.json');
    (parseJsonFile as Mock).mockResolvedValue({});
    (parseDatabaseModel as Mock).mockReturnValue({
      data: {
        rundowns: { default: rundown },
        customFields: {},
        settings: { auxTimerNames: ['Speaker', 'Break', 'Q&A'] },
      },
      migrated: false,
      errors: [],
    });

    await loadProjectFile('show.json');

    expect(auxTimerService.loadNames).toHaveBeenCalledWith(['Speaker', 'Break', 'Q&A']);
    expect(initRundown).toHaveBeenCalled();
  });
});

describe('patchCurrentProject', () => {
  const dataProvider = {
    mergeIntoData: vi.fn(),
    setRundown: vi.fn(),
    getCustomFields: vi.fn(() => ({})),
    getSettings: vi.fn(() => makeNewProject().settings),
    getData: vi.fn(),
  };

  // the patch endpoint lists every section, leaving the ones not patched undefined
  const emptyPatch = {
    rundowns: undefined,
    project: undefined,
    settings: undefined,
    viewSettings: undefined,
    urlPresets: undefined,
    customFields: undefined,
    automation: undefined,
  };

  beforeEach(() => {
    (getDataProvider as Mock).mockReturnValue(dataProvider);
    rundownCache.init(makeRundown({ id: 'loaded' }), {});
    // setup calls are not part of the patch
    vi.clearAllMocks();
  });

  it('only merges the sections which have a value', async () => {
    const settings = makeNewProject().settings;
    await patchCurrentProject({ ...emptyPatch, settings });

    expect(dataProvider.mergeIntoData).toHaveBeenCalledExactlyOnceWith({ settings });
  });

  it('stores patched rundowns without merging the rest of the project', async () => {
    const background = makeRundown({
      id: 'background',
      entries: { a: makeOntimeEvent({ id: 'a' }) },
      order: ['a'],
    });
    await patchCurrentProject({ ...emptyPatch, rundowns: { background } });

    expect(dataProvider.mergeIntoData).not.toHaveBeenCalled();
    expect(dataProvider.setRundown).toHaveBeenCalledExactlyOnceWith(
      'background',
      expect.objectContaining({ id: 'background' }),
    );
    expect(initRundown).not.toHaveBeenCalled();
  });

  it('reinitialises the loaded rundown when the patch replaces it', async () => {
    const loaded = makeRundown({ id: 'loaded', title: 'patched' });
    await patchCurrentProject({ ...emptyPatch, rundowns: { loaded } });

    expect(initRundown).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ id: 'loaded', title: 'patched' }),
      {},
      true,
    );
  });
});
