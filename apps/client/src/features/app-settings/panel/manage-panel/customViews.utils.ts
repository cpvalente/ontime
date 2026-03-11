import { baseURI, serverURL } from '../../../../externals';

export const customViewsDocs = 'https://docs.getontime.no/features/custom-views/';
const customViewSlugPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const maxUploadBytes = 4_000_000;
export const maxUploadLabel = `${maxUploadBytes / 1_000_000}MB`;

export function getSlugError(slug: string): string | null {
  if (!slug) {
    return 'Name is required.';
  }
  if (!customViewSlugPattern.test(slug)) {
    return 'Use lowercase letters, numbers, and dashes only.';
  }
  return null;
}

export function getFileError(file: File | null): string | null {
  if (!file) {
    return 'index.html is required.';
  }
  if (file.name.toLowerCase() !== 'index.html') {
    return 'Only index.html uploads are supported.';
  }
  if (file.size === 0) {
    return 'Uploaded file is empty.';
  }
  if (file.size > maxUploadBytes) {
    return `File size limit (${maxUploadLabel}) exceeded.`;
  }
  return null;
}

export function getViewUrl(slug: string): string {
  const url = new URL(serverURL);
  const path = slug ? `external/${encodeURIComponent(slug)}/` : 'external/';
  url.pathname = baseURI ? `${baseURI}/${path}` : `/${path}`;
  return url.toString();
}
