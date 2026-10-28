import { ProjectStartup } from 'ontime-types';
import { expect, vi } from 'vitest';

import { getProjectFiles, shouldShowWelcome } from '../project.utils.js';

vi.mock('fs/promises', () => {
  const mockFiles = ['file1.json', 'file2.json', 'file3.json', 'document.txt', 'image.png'];
  const mockStats = {
    birthtime: new Date('2020-01-01'),
    mtime: new Date('2021-01-01'),
  };

  return {
    readdir: vi.fn().mockResolvedValue(mockFiles),
    stat: vi.fn().mockResolvedValue(mockStats),
  };
});

describe('getProjectFiles test', () => {
  it('should return a list of project .json files', async () => {
    const { readdir, stat } = await import('fs/promises');

    const result = await getProjectFiles();

    const expectedFiles = ['file1', 'file2', 'file3'].map((file) => ({
      filename: file,
      updatedAt: new Date('2021-01-01').toISOString(),
    }));

    expect(result).toEqual(expectedFiles);
    expect(readdir).toHaveBeenCalled();
    expect(stat).toHaveBeenCalledTimes(expectedFiles.length);
  });
});

describe('shouldShowWelcome()', () => {
  const corrupt: ProjectStartup = {
    reason: 'recovered-corrupt',
    project: 'new project',
    corruptProject: 'show',
    setAside: true,
  };
  const resumed: ProjectStartup = { reason: 'resumed', project: 'show' };
  const firstRun: ProjectStartup = { reason: 'first-run', project: 'demo project' };

  test.each([
    {
      name: 'a failed load shows, even with the setting off',
      startup: corrupt,
      restore: false,
      setting: false,
      show: true,
    },
    { name: 'a restore point hides', startup: resumed, restore: true, setting: true, show: false },
    {
      name: 'a resumed project follows the setting off',
      startup: resumed,
      restore: false,
      setting: false,
      show: false,
    },
    { name: 'a first run follows the setting on', startup: firstRun, restore: false, setting: true, show: true },
  ])('$name', ({ startup, restore, setting, show }) => {
    expect(shouldShowWelcome(startup, restore, setting)).toBe(show);
  });
});
