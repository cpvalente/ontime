type ValidationStatus = {
  errors: string[];
  isValid: boolean;
};

export function validateFile(file: File): ValidationStatus {
  const status: ValidationStatus = { errors: [], isValid: true };
  if (!file) {
    status.errors.push('No file to upload');
    status.isValid = false;
  }

  // Limit file size of a project file to around 1MB
  if (file.name.endsWith('.json') && file.size > 1_000_000) {
    status.errors.push('File size limit (1MB) exceeded');
    status.isValid = false;
  }

  // Limit file size of an excel file to around 10MB
  if (file.name.endsWith('.xlsx') && file.size > 10_000_000) {
    status.errors.push('File size limit (10MB) exceeded');
    status.isValid = false;
  }

  // Check file extension
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.json')) {
    status.errors.push('Unhandled file type');
    status.isValid = false;
  }
  return status;
}

export function isExcelFile(file: File | null) {
  return file?.name.endsWith('.xlsx');
}

export function isOntimeFile(file: File | null) {
  return file?.name.endsWith('.json');
}
