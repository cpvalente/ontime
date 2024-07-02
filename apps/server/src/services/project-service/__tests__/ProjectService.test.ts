import { Mock } from 'vitest';

import { appStateProvider } from '../../app-state-service/AppStateService.js';

import { deleteProjectFile, duplicateProjectFile, renameProjectFile } from '../ProjectService.js';
import { doesProjectExist } from '../projectServiceUtils.js';

// stop the database loading from initiating
vi.mock('../../../setup/loadDb.js', () => {
  return {
    switchDb: vi.fn(),
  };
});

vi.mock('../../app-state-service/AppStateService.js', () => ({
  appStateProvider: {
    isLastLoadedProject: vi.fn(),
  },
}));

vi.mock('../projectServiceUtils.js', () => ({
  doesProjectExist: vi.fn(),
  getPathToProject: vi.fn(),
}));

/**
 * tests only assert errors since the
 * controller depend on these to send the right responses
 */
describe('deleteProjectFile', () => {
  it('throws an error if trying to delete the currently loaded project', async () => {
    (appStateProvider.isLastLoadedProject as Mock).mockResolvedValue(true);
    await expect(deleteProjectFile('loadedProject')).rejects.toThrow('Cannot delete currently loaded project');
  });

  it('throws an error if the project file does not exist', async () => {
    (appStateProvider.isLastLoadedProject as Mock).mockResolvedValue(false);
    (doesProjectExist as Mock).mockReturnValue(null);
    await expect(deleteProjectFile('nonexistentProject')).rejects.toThrow('Project file not found');
  });
});

describe('duplicateProjectFile', () => {
  it('throws an error if origin project does not exist', async () => {
    (doesProjectExist as Mock).mockReturnValue(null);
    await expect(duplicateProjectFile('does not exist', 'doesnt matter')).rejects.toThrow('Project file not found');
  });

  it('throws an error if new file name is already a project', () => {
    // current project exists
    (doesProjectExist as Mock).mockReturnValueOnce('thisoneexists');
    // new project exists
    (doesProjectExist as Mock).mockReturnValueOnce('existingproject');
    expect(duplicateProjectFile('thisoneexists', 'existingproject')).rejects.toThrow(
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
    expect(renameProjectFile('this one exists', 'existingproject')).rejects.toThrow(
      'Project file with name existingproject already exists',
    );
  });
});
