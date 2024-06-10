import { describe, it, expect } from 'vitest';
import { ensureJsonExtension, nameRecovered } from '../fileManagement.js';

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

describe('nameRecovered()', () => {
  it("should add '(recovered)' to the filename", () => {
    const filename = 'testfile.json';
    const result = nameRecovered(filename);
    expect(result).toBe('testfile (recovered).json');
  });
});
