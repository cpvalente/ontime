import { describe, it, expect, Mock } from 'vitest';
import * as fs from 'fs';

import {
  appendToName,
  ensureJsonExtension,
  generateUniqueFileName,
  incrementProjectNumber,
} from '../fileManagement.js';

// Mock fs.existsSync to control the test environment
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('ensureJsonExtension', () => {
  it('should add .json to a filename without an extension', () => {
    const filename = 'testfile';
    const result = ensureJsonExtension(filename);
    expect(result).toBe('testfile.json');
  });

  it('should not add .json to a filename that already has .json', () => {
    const filename = 'testfile.json';
    const result = ensureJsonExtension(filename);
    expect(result).toBe('testfile.json');
  });

  it('should add .json to a filename with a different extension', () => {
    const filename = 'testfile.txt';
    const result = ensureJsonExtension(filename);
    expect(result).toBe('testfile.txt.json');
  });

  it('should handle filenames with multiple dots', () => {
    const filename = 'my.test.file';
    const result = ensureJsonExtension(filename);
    expect(result).toBe('my.test.file.json');
  });
});

describe('appendToName', () => {
  it('appends a given string to a file name', () => {
    const filename = 'file.json';
    const append = '(recovered)';
    const result = appendToName(filename, append);
    expect(result).toBe('file (recovered).json');
  });

  it('handles paths', () => {
    const path = '/Users/carlos/Library/Application Support/Ontime/projects/file.json';
    const append = '(recovered)';
    const result = appendToName(path, append);
    expect(result).toBe('/Users/carlos/Library/Application Support/Ontime/projects/file (recovered).json');
  });

  it('handles multiple . in string', () => {
    const path = 'strange.file.name.json';
    const append = '(recovered)';
    const result = appendToName(path, append);
    expect(result).toBe('strange.file.name (recovered).json');
  });
});

describe('generateUniqueFileName', () => {
  const directory = '/test/directory';
  const filename = 'testFile.txt';
  const baseName = 'testFile';
  const extension = '.txt';

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should return original file name if there is no conflict', () => {
    (fs.existsSync as Mock).mockReturnValue(false);
    const uniqueFilename = generateUniqueFileName(directory, filename);
    expect(uniqueFilename).toBe(filename);
  });

  it('should append a counter to the filename if a conflict exists', () => {
    // Mock the first call to return true (file exists), then false
    (fs.existsSync as Mock).mockReturnValueOnce(true).mockReturnValueOnce(false);
    const expectedFilename = `${baseName} (1)${extension}`;
    const uniqueFilename = generateUniqueFileName(directory, filename);
    expect(uniqueFilename).toBe(expectedFilename);
  });

  it('should increment the counter for each conflict until a unique filename is found', () => {
    // Mock the first two calls to return true (file exists), then false
    (fs.existsSync as Mock).mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(false);
    const expectedFilename = `${baseName} (2)${extension}`;
    const uniqueFilename = generateUniqueFileName(directory, filename);
    expect(uniqueFilename).toBe(expectedFilename);
  });
});

describe('file index', () => {
  it('sets index to 1 when there is no index', () => {
    expect(incrementProjectNumber('test file.json')).toBe('test file (1).json');
  });

  it('increments to 2 when index is 1', () => {
    expect(incrementProjectNumber('test file (1).json')).toBe('test file (2).json');
  });

  it('does not count number not wrapped in parenthesis', () => {
    expect(incrementProjectNumber('test file 1.json')).toBe('test file 1 (1).json');
  });

  it('does not count number if there is not a space', () => {
    expect(incrementProjectNumber('test file(1).json')).toBe('test file(1) (1).json');
  });

  it('counts multi digit numbers', () => {
    expect(incrementProjectNumber('test file (890).json')).toBe('test file (891).json');
  });
});
