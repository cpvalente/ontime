import { ConflictError, InvalidInputError, NotFoundError } from '../../middleware/errors.js';

export class CustomFieldExistsError extends ConflictError {
  constructor(label: string) {
    super(`Label ${label} already exists`);
  }
}

export class CustomFieldNotFoundError extends NotFoundError {
  constructor(key: string) {
    super(`Could not find custom field ${key}`);
  }
}

export class CustomFieldTypeChangeError extends InvalidInputError {
  constructor() {
    super('Change of field type is not allowed');
  }
}

export class InvalidRundownTitleError extends InvalidInputError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCustomFieldLabelError extends InvalidInputError {
  constructor() {
    super('Unable to convert label to a valid key');
  }
}
