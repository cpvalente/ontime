import { ConflictError, InvalidInputError, NotFoundError } from '../../middleware/errors.js';

export class CustomViewNameError extends InvalidInputError {
  constructor() {
    super('Invalid name. Use lowercase letters, numbers, and dashes only.');
  }
}

/** The uploaded file is not a self-contained index.html */
export class CustomViewFileError extends InvalidInputError {}

export class CustomViewExistsError extends ConflictError {
  constructor(slug: string, options?: ErrorOptions) {
    super(`Name "${slug}" already exists`, options);
  }
}

export class CustomViewNotFoundError extends NotFoundError {
  constructor(slug: string) {
    super(`Custom view "${slug}" not found`);
  }
}
