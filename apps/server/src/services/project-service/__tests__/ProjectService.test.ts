import { writeFile } from 'fs/promises';

import { OntimeView, TimerLifeCycle } from 'ontime-types';
import { Mock } from 'vitest';

import { isLastLoadedProject } from '../../app-state-service/AppStateService.js';
import {
  createProjectFromSections,
  deleteProjectFile,
  duplicateProjectFile,
  renameProjectFile,
} from '../ProjectService.js';
import { doesProjectExist, parseJsonFile } from '../projectServiceUtils.js';
import { makeNewProject } from '../../../models/dataModel.js';

// stop the database loading from initiating
vi.mock('../../../setup/loadDb.js', () => {
  return {
    switchDb: vi.fn(),
  };
});

vi.mock('../../app-state-service/AppStateService.js', () => ({
  isLastLoadedProject: vi.fn(),
}));

vi.mock('../projectServiceUtils.js', () => ({
  doesProjectExist: vi.fn(),
  getPathToProject: vi.fn().mockImplementation((name: string) => `/projects/${name}`),
  parseJsonFile: vi.fn(),
}));

vi.mock('fs/promises', async (importOriginal) => ({
  ...(await importOriginal<typeof import('fs/promises')>()),
  writeFile: vi.fn(),
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

describe('createProjectFromSections', () => {
  it('throws an error if origin project does not exist', async () => {
    (doesProjectExist as Mock).mockReturnValue(null);
    await expect(createProjectFromSections('does not exist', 'template', ['automation'])).rejects.toThrow(
      'Project file not found',
    );
  });

  it('throws an error if nothing was selected', async () => {
    (doesProjectExist as Mock).mockReturnValue('/projects/source.json');
    await expect(createProjectFromSections('source.json', 'template', [])).rejects.toThrow(
      'At least one section must be selected',
    );
  });

  it('writes a project carrying only the selected sections', async () => {
    (doesProjectExist as Mock).mockReturnValue('/projects/source.json');
    (parseJsonFile as Mock).mockResolvedValue({
      ...makeNewProject(),
      urlPresets: [
        { target: OntimeView.Timer, enabled: true, alias: 'from-source', search: '', displayInNav: false },
      ],
      automation: {
        enabledAutomations: true,
        enabledOscIn: false,
        oscPortIn: 8888,
        triggers: [{ id: 't1', title: 'on start', trigger: TimerLifeCycle.onStart, automationId: 'a1' }],
        automations: {
          a1: { id: 'a1', title: 'from source', filterRule: 'all', filters: [], outputs: [{ type: 'http', url: 'http://127.0.0.1/go' }] },
        },
      },
    });

    await createProjectFromSections('source.json', 'template.json', ['automation']);

    expect(writeFile).toHaveBeenCalledOnce();
    const written = JSON.parse((writeFile as Mock).mock.calls[0][1] as string);

    // the automations came across, triggers included
    expect(written.automation.automations.a1.title).toBe('from source');
    expect(written.automation.triggers).toHaveLength(1);

    // and the url preset, which parses cleanly but was not selected, did not
    expect(written.urlPresets).toEqual([]);
  });
});
