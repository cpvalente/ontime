import { is } from '../../utils/is.js';
import {
  SheetsApiDisabledError,
  SheetsConnectionRequiredError,
  SpreadsheetUnavailableError,
  UnsupportedSpreadsheetFormatError,
} from './sheets.errors.js';

/** google-auth-library keeps the HTTP response on thrown errors; the body is either an OAuth string or an API error */
function getGoogleFailure(error: unknown): { status?: number; body?: unknown } {
  if (!is.object(error) || !('response' in error) || !is.object(error.response)) return {};
  const { response } = error;
  const status = 'status' in response && typeof response.status === 'number' ? response.status : undefined;
  const body =
    'data' in response && is.object(response.data) && 'error' in response.data ? response.data.error : undefined;
  return { status, body };
}

function hasErrorReason(body: unknown, reasons: string[]): boolean {
  if (!is.object(body) || !('errors' in body) || !Array.isArray(body.errors)) return false;
  return body.errors.some((entry) => is.object(entry) && 'reason' in entry && reasons.includes(entry.reason as string));
}

/** Translates the Google failures a user can act on; anything else is left for the 500 handler */
export function rethrowGoogleSheetError(error: unknown): never {
  const { status, body } = getGoogleFailure(error);

  if (status === 401 || body === 'invalid_grant') throw new SheetsConnectionRequiredError();
  if (status === 404 || (status === 403 && hasErrorReason(body, ['forbidden', 'insufficientPermissions']))) {
    throw new SpreadsheetUnavailableError();
  }
  if (status === 403 && hasErrorReason(body, ['accessNotConfigured'])) throw new SheetsApiDisabledError();
  if (status === 400 && hasErrorReason(body, ['failedPrecondition'])) throw new UnsupportedSpreadsheetFormatError();
  throw error;
}
