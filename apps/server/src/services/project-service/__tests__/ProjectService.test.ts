import { deleteProjectFile } from '../ProjectService.js';
import { appStateProvider } from '../../app-state-service/AppStateService.js';
import { doesProjectExist, getPathToProject } from '../projectServiceUtils.js';
import { Mock } from 'vitest';
import { deleteFile } from '../../../utils/parserUtils.js';

vi.mock('./appStateProvider');
vi.mock('./fileSystem');
vi.mock('../../app-state-service/AppStateService.js', () => ({
  appStateProvider: {
    isLastLoadedProject: vi.fn(),
  },
}));
vi.mock('../projectServiceUtils.js', () => ({
  doesProjectExist: vi.fn(),
  getPathToProject: vi.fn(),
}));
vi.mock('../../../utils/parserUtils.js', () => ({
  deleteFile: vi.fn(),
}));

describe('deleteProjectFile', () => {
  it('throws an error if trying to delete the currently loaded project', async () => {
    (appStateProvider.isLastLoadedProject as Mock).mockResolvedValue(true);
    await expect(deleteProjectFile('loadedProject')).rejects.toThrow('Cannot delete currently loaded project');
  });

  it('throws an error if the project file does not exist', async () => {
    (appStateProvider.isLastLoadedProject as Mock).mockResolvedValue(false);
    (doesProjectExist as Mock).mockReturnValue(false);
    await expect(deleteProjectFile('nonexistentProject')).rejects.toThrow('Project file not found');
  });

  it('deletes the project file successfully', async () => {
    (appStateProvider.isLastLoadedProject as Mock).mockResolvedValue(false);
    (doesProjectExist as Mock).mockReturnValue(true);
    (getPathToProject as Mock).mockReturnValue('/path/to/project');
    (deleteFile as Mock).mockResolvedValue(undefined);

    await deleteProjectFile('existingProject');

    expect(getPathToProject).toHaveBeenCalledWith('existingProject');
    expect(deleteFile).toHaveBeenCalledWith('/path/to/project');
  });
});
