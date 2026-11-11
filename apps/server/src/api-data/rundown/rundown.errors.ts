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

export class RundownNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Rundown with id: ${id} not found`);
  }
}

/** A rundown cannot be deleted while it is loaded, or when it is the last one */
export class RundownDeleteConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class EntryNotFoundError extends NotFoundError {
  constructor(message: string) {
    super(message);
  }
}

export class EntryExistsError extends ConflictError {
  constructor(id: string) {
    super(`Event with ID ${id} already exists`);
  }
}

/** The requested operation does not apply to the given entries */
export class InvalidEntryOperationError extends InvalidInputError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCustomFieldLabelError extends InvalidInputError {
  constructor() {
    super('Unable to convert label to a valid key');
  }
}

export class InvalidCustomFieldOrderError extends InvalidInputError {
  constructor() {
    super('The order must list each existing custom field at most once');
  }
}
