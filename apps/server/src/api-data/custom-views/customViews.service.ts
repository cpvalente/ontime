import { join, resolve } from 'node:path';

import { type CustomViewSummary } from 'ontime-types';

import { defaultDemoHtml } from '../../bundle/bundledDemoHtml.js';
import { publicDir } from '../../setup/index.js';
import {
  createDirectory,
  deleteDirectory,
  ensureDirectory,
  fileIsReadable,
  isNodeError,
  readDirectoryEntries,
  replaceDirectory,
  statIfExists,
  writeToFile,
} from '../../utils/fileManagement.js';
import { CustomViewError } from './customViews.errors.js';

/**
 * Patterns that indicate external resource loading.
 * Custom views must be self-contained single HTML files with only inline CSS and JavaScript.
 */
const forbiddenHtmlPatterns: { pattern: RegExp; message: string }[] = [
  { pattern: /<script[^>]+src\s*=/i, message: 'External scripts are not allowed. Use inline <script> instead.' },
  {
    pattern: /<link[^>]+rel\s*=\s*["']?stylesheet["']?/i,
    message: 'External stylesheets are not allowed. Use inline <style> instead.',
  },
  { pattern: /<iframe[\s>]/i, message: 'Iframes are not allowed.' },
];

export function validateHtmlContent(content: string): void {
  const htmlDoctype = /^\s*<!doctype\s+html[\s>]/i;
  const htmlTag = /^\s*<html[\s>]/i;
  if (!htmlDoctype.test(content) && !htmlTag.test(content)) {
    throw new CustomViewError(
      'File does not appear to be valid HTML. Expected <!DOCTYPE html> or <html> at the start.',
      400,
    );
  }

  for (const { pattern, message } of forbiddenHtmlPatterns) {
    if (pattern.test(content)) {
      throw new CustomViewError(message, 400);
    }
  }
}

const allowedSlugChars = /^[a-z0-9-]+$/;
export function isValidCustomViewSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  if (slug.length < 1 || slug.length > 63) return false;
  if (!allowedSlugChars.test(slug)) return false;
  if (slug.startsWith('-') || slug.endsWith('-')) return false;
  return true;
}

export function resolveCustomViewDirectory(slug: string): string {
  if (!isValidCustomViewSlug(slug)) {
    throw new CustomViewError('Invalid name. Use lowercase letters, numbers, and dashes only.', 400);
  }

  return resolve(publicDir.externalDir, slug);
}

export function getPathToCustomView(slug: string): string {
  return join(resolveCustomViewDirectory(slug), customViewIndexFilename);
}

export interface CustomViewUploadFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export const customViewMaxFileSize = 4_000_000; // 4MB
export const customViewIndexFilename = 'index.html';
export function validateCustomViewUpload(file: CustomViewUploadFile | undefined): CustomViewUploadFile {
  if (!file) {
    throw new CustomViewError('File not found', 422);
  }

  const fileName = file.originalname.trim().toLowerCase();
  if (fileName !== customViewIndexFilename) {
    throw new CustomViewError('Only index.html uploads are supported', 400);
  }

  if (file.size === 0) {
    throw new CustomViewError('Uploaded file is empty', 400);
  }

  if (file.size > customViewMaxFileSize) {
    throw new CustomViewError(`File size limit (${customViewMaxFileSize / 1_000_000}MB) exceeded`, 413);
  }

  const content = file.buffer.toString('utf-8');
  validateHtmlContent(content);

  return file;
}

export async function listCustomViews(): Promise<CustomViewSummary[]> {
  ensureDirectory(publicDir.externalDir);

  const entries = await readDirectoryEntries(publicDir.externalDir);
  const views: CustomViewSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || !isValidCustomViewSlug(entry.name)) continue;

    const indexStats = await statIfExists(getPathToCustomView(entry.name));
    if (!indexStats?.isFile()) continue;

    views.push({ slug: entry.name });
  }

  return views.sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function uploadCustomView(
  slug: string,
  file: CustomViewUploadFile | undefined,
): Promise<CustomViewSummary> {
  const uploadFile = validateCustomViewUpload(file);
  ensureDirectory(publicDir.externalDir);

  const viewDirectory = resolveCustomViewDirectory(slug);
  const indexFile = getPathToCustomView(slug);

  try {
    await createDirectory(viewDirectory);
  } catch (error) {
    if (isNodeError(error) && error.code === 'EEXIST') {
      throw new CustomViewError(`Name "${slug}" already exists`, 409);
    }
    throw error;
  }

  try {
    await writeToFile(indexFile, uploadFile.buffer);
    return { slug };
  } catch (error) {
    await deleteDirectory(viewDirectory);
    throw error;
  }
}

export async function getCustomViewDownloadPath(slug: string): Promise<string> {
  const indexFile = getPathToCustomView(slug);

  if (!(await fileIsReadable(indexFile))) {
    throw new CustomViewError(`Custom view "${slug}" not found`, 404);
  }

  return indexFile;
}

const demoViewSlug = 'demo';
export async function restoreDemoView(): Promise<CustomViewSummary> {
  ensureDirectory(publicDir.externalDir);

  const viewDirectory = resolveCustomViewDirectory(demoViewSlug);
  const indexFile = getPathToCustomView(demoViewSlug);

  await replaceDirectory(viewDirectory);
  await writeToFile(indexFile, defaultDemoHtml, { encoding: 'utf-8' });

  return { slug: demoViewSlug };
}

export async function deleteCustomView(slug: string): Promise<void> {
  await deleteDirectory(resolveCustomViewDirectory(slug));
}
