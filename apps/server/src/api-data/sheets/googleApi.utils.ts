import { UnsupportedSpreadsheetFormatError } from './sheets.errors.js';

// https://developers.google.com/calendar/api/guides/errors
interface GoogleApiError {
  code: number;
  message: string;
  errors?: {
    message: string;
    domain: string;
    reason: string;
  }[];
}

/**
 * Checks whether an error is a Google API error
 */
function isGoogleApiError(error: any): error is GoogleApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof error.code === 'number' &&
    Array.isArray(error.errors) &&
    typeof error.errors[0]?.reason === 'string' &&
    typeof error.errors[0]?.message === 'string'
  );
}

/**
 * Extract utility to handle a common error where a user imports an xlsx file instead of a Google Sheet
 */
export function rethrowGoogleSheetError(error: unknown): never {
  if (
    isGoogleApiError(error) &&
    error.code === 400 &&
    Array.isArray(error.errors) &&
    error.errors.length > 0 &&
    error.errors[0]?.reason === 'failedPrecondition' &&
    error.errors[0]?.message === 'This operation is not supported for this document'
  ) {
    throw new UnsupportedSpreadsheetFormatError();
  }
  throw error;
}
