import { describe, it, expect } from 'vitest';
import { appendToName, ensureJsonExtension } from '../fileManagement.js';

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
