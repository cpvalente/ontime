import { ConflictError, InvalidInputError, NotFoundError } from '../../middleware/errors.js';

export class UrlPresetExistsError extends ConflictError {
  constructor(alias: string) {
    super(`Preset with alias ${alias} already exists.`);
  }
}

export class UrlPresetNotFoundError extends NotFoundError {
  constructor(alias: string) {
    super(`Preset with alias ${alias} does not exist.`);
  }
}

export class UrlPresetAliasChangeError extends InvalidInputError {
  constructor() {
    super('Changing alias is not permitted');
  }
}
