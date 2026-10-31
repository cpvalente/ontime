import { ConflictError, InvalidInputError, NotFoundError } from '../../middleware/errors.js';

export class SheetsConnectionRequiredError extends ConflictError {
  constructor() {
    super('Not authenticated. Connect to Google Sheets first.');
  }
}

export class WorksheetNotFoundError extends NotFoundError {
  constructor() {
    super('Could not find worksheet');
  }
}

export class InvalidSheetsClientSecretError extends InvalidInputError {
  constructor() {
    super('Client secret is invalid');
  }
}

export class InvalidSheetDataError extends InvalidInputError {
  constructor(message: string) {
    super(message);
  }
}

export class UnsupportedSpreadsheetFormatError extends InvalidInputError {
  constructor() {
    super('Cannot read the linked file as a Google Sheet. It may be an .xlsx file instead.');
  }
}
