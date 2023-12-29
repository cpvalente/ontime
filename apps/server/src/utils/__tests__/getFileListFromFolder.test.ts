import { expect, vi } from 'vitest';

import { getProjectFiles } from '../getFileListFromFolder.js';

describe('getProjectFiles test', async () => {
  it('should return a list of project .json files', async () => {
    vi.mock('fs', () => {
      const mockFiles = ['file1.json', 'file2.json', 'file3.json', 'document.txt', 'image.png'];
      const mockStats = {
        birthtime: new Date('2020-01-01'),
        mtime: new Date('2021-01-01'),
      };

      return {
        readdirSync: vi.fn().mockReturnValue(mockFiles),
        statSync: vi.fn().mockReturnValue(mockStats),
      };
    });

    const { readdirSync, statSync } = await import('fs');

    const result = getProjectFiles();

    const expectedFiles = ['file1.json', 'file2.json', 'file3.json'].map((file) => ({
      filename: file,
      createdAt: new Date('2020-01-01').toISOString(),
      updatedAt: new Date('2021-01-01').toISOString(),
    }));

    expect(result).toEqual(expectedFiles);
    expect(readdirSync).toHaveBeenCalled();
    expect(statSync).toHaveBeenCalledTimes(expectedFiles.length);
  });
});
