import { ConflictError } from '../../middleware/errors.js';

export class PortChangeInDockerError extends ConflictError {
  constructor() {
    super('Can not change port when running inside docker');
  }
}
