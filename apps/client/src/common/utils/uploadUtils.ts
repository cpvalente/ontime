/**
 * Collection of rules for pre-validating a spreadsheet
 * @param file
 */
export function validateSpreadsheetImport(file: File) {
  if (!isExcelFile(file)) {
    throw new Error('Unknown file type');
  }

  // Check if file is empty
  if (file.size === 0) {
    throw new Error('File is empty');
  }

  // Limit file size of an excel file to around 10MB
  if (file.size > 10_000_000) {
    throw new Error('File size limit (10MB) exceeded');
  }
}

/**
 * Collection of rules for pre-validating a project file
 * @param file
 */
export function validateProjectFile(file: File) {
  if (!isOntimeFile(file)) {
    throw new Error('Unknown file type');
  }

  // Check if file is empty
  if (file.size === 0) {
    throw new Error('File is empty');
  }

  // Limit file size of a project file to around 1MB
  if (file.size > 1_000_000) {
    throw new Error('File size limit (10MB) exceeded');
  }
}

export function isExcelFile(file: File | null) {
  return file?.name.endsWith('.xlsx');
}

export function isOntimeFile(file: File | null) {
  return file?.name.endsWith('.json');
}
