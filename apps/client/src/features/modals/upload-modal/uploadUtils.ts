import { ExcelImportMap } from 'ontime-utils';

import { ProjectFileImportOptions } from '../../../common/api/ontimeApi';

/**
 * Validates a file according to the app upload contract
 * @throws
 * @param file
 */
export function validateFile(file: File) {
  if (!file) {
    throw new Error('No file to upload');
  }

  // Check if file is empty
  if (file.size === 0) {
    throw new Error('File is empty');
  }

  // Limit file size of a project file to around 1MB
  if (file.name.endsWith('.json') && file.size > 1_000_000) {
    throw new Error('File size limit (1MB) exceeded');
  }

  // Limit file size of an excel file to around 10MB
  if (file.name.endsWith('.xlsx') && file.size > 10_000_000) {
    throw new Error('File size limit (10MB) exceeded');
  }

  // Check file extension
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.json')) {
    throw new Error('Unhandled file type');
  }
}

export function isExcelFile(file: File | null) {
  return file?.name.endsWith('.xlsx');
}

export function isOntimeFile(file: File | null) {
  return file?.name.endsWith('.json');
}

type PersistedOntimeOptions = {
  optionType: 'ontime';
  options: Partial<ProjectFileImportOptions>;
};

type PersistedExcelOptions = {
  optionType: 'excel';
  options: ExcelImportMap;
};

export function persistOptions(options: PersistedOntimeOptions | PersistedExcelOptions) {
  localStorage.setItem(`ontime-import-options-${options.optionType}`, JSON.stringify(options.options));
}

export function getPersistedOptions(optionType: 'excel' | 'ontime') {
  const options = localStorage.getItem(`ontime-import-options-${optionType}`);
  if (!options) {
    return null;
  }
  return JSON.parse(options);
}
