import { InvalidInputError, NotFoundError } from '../../middleware/errors.js';

export class InvalidSpreadsheetDataError extends InvalidInputError {
  constructor(message: string) {
    super(message);
  }
}

export class SpreadsheetWorksheetNotFoundError extends NotFoundError {
  constructor(worksheet: string) {
    super(`Could not find worksheet: ${worksheet}`);
  }
}
