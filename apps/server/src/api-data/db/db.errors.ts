import { InvalidInputError } from '../../middleware/errors.js';

/**
 * A project file this version cannot load, which is not corrupt
 * eg: made by a newer version of Ontime
 * The file is left as it is so a matching version can still open it
 */
export class UnsupportedProjectError extends InvalidInputError {
  constructor(message: string) {
    super(message);
  }
}
