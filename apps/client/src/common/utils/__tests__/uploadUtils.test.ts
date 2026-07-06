import { describe, expect, it } from 'vitest';

import { removeFileExtension } from '../uploadUtils';

describe('removeFileExtension()', () => {
  it('removes a trailing extension', () => {
    expect(removeFileExtension('show.xlsx')).toBe('show');
  });

  it('only removes the last extension', () => {
    expect(removeFileExtension('my.show.xlsx')).toBe('my.show');
  });

  it('returns the name unchanged when there is no extension', () => {
    expect(removeFileExtension('rundown')).toBe('rundown');
  });

  it('does not treat a leading dot as an extension', () => {
    expect(removeFileExtension('.gitignore')).toBe('.gitignore');
  });

  it('handles an empty string', () => {
    expect(removeFileExtension('')).toBe('');
  });
});
