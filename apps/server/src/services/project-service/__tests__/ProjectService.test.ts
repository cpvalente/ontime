import { expect, vi } from 'vitest';

import { getProjectFiles } from '../ProjectService.js';

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
      createdAt: new Date('2020-01-01').toISOString(),
      updatedAt: new Date('2021-01-01').toISOString(),
    }));

    expect(result).toEqual(expectedFiles);
    expect(readdir).toHaveBeenCalled();
    expect(stat).toHaveBeenCalledTimes(expectedFiles.length);
  });
});
