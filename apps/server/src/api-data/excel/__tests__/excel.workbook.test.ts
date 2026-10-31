import { defaultImportMap } from 'ontime-utils';
import { afterEach, expect, it, vi } from 'vitest';
import xlsx from 'xlsx';

import { SpreadsheetWorkbookUnavailableError } from '../excel.errors.js';
import { generateRundownPreview, getWorksheetMetadata } from '../excel.service.js';
import { getWorkbook, retainWorkbook } from '../excel.workbook.js';

afterEach(() => {
  vi.useRealTimers();
});

it('expires an abandoned workbook after an hour of inactivity', () => {
  vi.useFakeTimers();
  const workbook = xlsx.utils.book_new();
  retainWorkbook(workbook);

  vi.advanceTimersByTime(59 * 60 * 1000);
  expect(getWorkbook()).toBe(workbook);

  vi.advanceTimersByTime(59 * 60 * 1000);
  expect(getWorkbook()).toBe(workbook);

  vi.advanceTimersByTime(60 * 60 * 1000);
  expect(getWorkbook()).toBeNull();
});

it('keeps a replacement workbook until its own expiry', () => {
  vi.useFakeTimers();
  const first = xlsx.utils.book_new();
  const second = xlsx.utils.book_new();
  retainWorkbook(first);

  vi.advanceTimersByTime(59 * 60 * 1000);
  retainWorkbook(second);
  vi.advanceTimersByTime(2 * 60 * 1000);
  expect(getWorkbook()).toBe(second);

  vi.advanceTimersByTime(60 * 60 * 1000);
  expect(getWorkbook()).toBeNull();
});

it('requires another upload after the workbook expires, for both metadata and preview', () => {
  vi.useFakeTimers();
  retainWorkbook(xlsx.utils.book_new());
  vi.advanceTimersByTime(60 * 60 * 1000);
  expect(() => getWorksheetMetadata('Main')).toThrow(SpreadsheetWorkbookUnavailableError);
  expect(() => generateRundownPreview(defaultImportMap)).toThrow(SpreadsheetWorkbookUnavailableError);
});
