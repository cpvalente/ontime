import { is } from '../../utils/is.js';
import {
  InvalidSheetsClientSecretError,
  SheetsConnectionRequiredError,
  SpreadsheetUnavailableError,
  UnsupportedSpreadsheetFormatError,
} from './sheets.errors.js';

// https://developers.google.com/calendar/api/guides/errors
interface GoogleApiError {
  code: number;
  message: string;
  errors?: { reason: string; message?: string }[];
}

function isGoogleApiError(error: unknown): error is GoogleApiError {
  return (
    is.object(error) &&
    is.objectWithKeys(error, ['code', 'message']) &&
    typeof error.code === 'number' &&
    typeof error.message === 'string' &&
    (!('errors' in error) ||
      error.errors === undefined ||
      (Array.isArray(error.errors) &&
        error.errors.every((entry) => is.object(entry) && 'reason' in entry && typeof entry.reason === 'string')))
  );
}

/** Gaxios keeps the HTTP response; DefaultTransporter may also copy the API error to the thrown object. */
function getGoogleResponse(error: unknown): { status: number; data: unknown } | undefined {
  if (!is.object(error) || !('response' in error) || !is.object(error.response)) return;
  const response = error.response;
  if ('status' in response && typeof response.status === 'number' && 'data' in response) {
    return { status: response.status, data: response.data };
  }
}

/** Translate only recognised Google failures, leaving all other errors for the 500 handler. */
export function rethrowGoogleSheetError(error: unknown): never {
  const response = getGoogleResponse(error);
  if (response?.status === 400 && is.object(response.data) && 'error' in response.data) {
    if (response.data.error === 'invalid_grant') throw new SheetsConnectionRequiredError();
    if (response.data.error === 'invalid_client') throw new InvalidSheetsClientSecretError();
  }

  const candidate = is.object(response?.data) && 'error' in response.data ? response.data.error : error;
  const apiError = isGoogleApiError(candidate) ? candidate : undefined;
  if (!apiError || (response && response.status !== apiError.code)) throw error;

  if (
    apiError.code === 400 &&
    apiError.errors?.some(
      ({ reason, message }) =>
        reason === 'failedPrecondition' && message === 'This operation is not supported for this document',
    )
  ) {
    throw new UnsupportedSpreadsheetFormatError();
  }
  if (
    apiError.code === 404 ||
    (apiError.code === 403 &&
      apiError.errors?.some(({ reason }) => reason === 'forbidden' || reason === 'insufficientPermissions'))
  ) {
    throw new SpreadsheetUnavailableError();
  }
  if (apiError.code === 401) throw new SheetsConnectionRequiredError();
  throw error;
}
