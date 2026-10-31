import { rethrowGoogleSheetError } from '../googleApi.utils.js';
import {
  InvalidSheetsClientSecretError,
  SheetsConnectionRequiredError,
  SpreadsheetUnavailableError,
  UnsupportedSpreadsheetFormatError,
} from '../sheets.errors.js';

const apiError = (code: number, reason: string, message = 'private Google message') => ({
  code,
  message,
  errors: [{ reason, message }],
});
const responseError = (code: number, reason: string, message?: string) => ({
  response: { status: code, data: { error: apiError(code, reason, message) } },
});

it.each([
  [
    apiError(400, 'failedPrecondition', 'This operation is not supported for this document'),
    UnsupportedSpreadsheetFormatError,
  ],
  [
    responseError(400, 'failedPrecondition', 'This operation is not supported for this document'),
    UnsupportedSpreadsheetFormatError,
  ],
  [responseError(404, 'notFound'), SpreadsheetUnavailableError],
  [apiError(403, 'insufficientPermissions'), SpreadsheetUnavailableError],
  [responseError(401, 'authError'), SheetsConnectionRequiredError],
  [{ response: { status: 400, data: { error: 'invalid_grant' } } }, SheetsConnectionRequiredError],
  [{ response: { status: 400, data: { error: 'invalid_client' } } }, InvalidSheetsClientSecretError],
])('translates a recognised Google error %j to a domain error', (error, expected) => {
  expect(() => rethrowGoogleSheetError(error)).toThrow(expected);
});

it.each([
  new Error('network failure'),
  responseError(403, 'rateLimitExceeded'),
  responseError(429, 'quotaExceeded'),
  responseError(500, 'backendError'),
  { code: 404 },
  { code: 404, message: 'malformed API error', errors: 'invalid' },
  { response: { status: 500, data: { error: apiError(404, 'notFound') } } },
])('preserves unknown, quota and malformed errors without reclassifying them: %j', (error) => {
  let thrown;
  try {
    rethrowGoogleSheetError(error);
  } catch (failure) {
    thrown = failure;
  }
  expect(thrown).toBe(error);
});
