import { describe, expect, it } from 'vitest';

import { CustomViewFileError, CustomViewNameError } from '../customViews.errors.js';
import { isValidCustomViewSlug, resolveCustomViewDirectory, validateHtmlContent } from '../customViews.service.js';

describe('isValidCustomViewSlug()', () => {
  it('accepts valid slugs', () => {
    expect(isValidCustomViewSlug('a')).toBe(true);
    expect(isValidCustomViewSlug('my-view-1')).toBe(true);
    expect(isValidCustomViewSlug('example123')).toBe(true);
  });

  it('rejects empty or too long', () => {
    expect(isValidCustomViewSlug('')).toBe(false);
    expect(isValidCustomViewSlug('a'.repeat(64))).toBe(false);
  });

  it('rejects invalid characters', () => {
    expect(isValidCustomViewSlug('Hello')).toBe(false);
    expect(isValidCustomViewSlug('my_view')).toBe(false);
    expect(isValidCustomViewSlug('my view')).toBe(false);
    expect(isValidCustomViewSlug('../escape')).toBe(false);
  });

  it('rejects leading or trailing hyphens', () => {
    expect(isValidCustomViewSlug('-start')).toBe(false);
    expect(isValidCustomViewSlug('end-')).toBe(false);
  });
});

describe('resolveCustomViewDirectory()', () => {
  it('rejects invalid slugs', () => {
    expect(() => resolveCustomViewDirectory('Hello-World')).toThrow(CustomViewNameError);
    expect(() => resolveCustomViewDirectory('../escape')).toThrow(CustomViewNameError);
    expect(() => resolveCustomViewDirectory('')).toThrow(CustomViewNameError);
  });
});

describe('validateHtmlContent()', () => {
  it('accepts valid HTML with doctype', () => {
    expect(() => validateHtmlContent('<!DOCTYPE html><html><body>hello</body></html>')).not.toThrow();
  });

  it('accepts valid HTML starting with html tag', () => {
    expect(() => validateHtmlContent('<html><body>hello</body></html>')).not.toThrow();
  });

  it('accepts HTML with inline script and style', () => {
    const html = '<!DOCTYPE html><html><head><style>body{}</style></head><body><script>alert(1)</script></body></html>';
    expect(() => validateHtmlContent(html)).not.toThrow();
  });

  it('rejects content that is not HTML', () => {
    expect(() => validateHtmlContent('just some text')).toThrow(CustomViewFileError);
    expect(() => validateHtmlContent('{"json": true}')).toThrow(CustomViewFileError);
  });

  it('rejects external script imports', () => {
    const html = '<!DOCTYPE html><html><body><script src="https://cdn.example.com/app.js"></script></body></html>';
    expect(() => validateHtmlContent(html)).toThrow('External scripts are not allowed');
  });

  it('rejects external stylesheets', () => {
    const html = '<!DOCTYPE html><html><head><link rel="stylesheet" href="styles.css"></head><body></body></html>';
    expect(() => validateHtmlContent(html)).toThrow('External stylesheets are not allowed');
  });

  it('rejects iframes', () => {
    const html = '<!DOCTYPE html><html><body><iframe src="https://example.com"></iframe></body></html>';
    expect(() => validateHtmlContent(html)).toThrow('Iframes are not allowed');
  });

  it('allows link tags that are not stylesheets', () => {
    const html = '<!DOCTYPE html><html><head><link rel="icon" href="data:,"></head><body></body></html>';
    expect(() => validateHtmlContent(html)).not.toThrow();
  });
});
