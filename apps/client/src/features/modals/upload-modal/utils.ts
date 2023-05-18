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

  // Limit file size to 1MB
  if (file.size > 1000000) {
    status.errors.push('File size limit (1MB) exceeded');
    status.isValid = false;
  }

  // Check file extension
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.json')) {
    status.errors.push('Unhandled file type');
    status.isValid = false;
  }
  return status;
}
