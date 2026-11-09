import { ConflictError, NotFoundError } from '../../middleware/errors.js';

export class TriggerNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Trigger with id ${id} not found`);
  }
}

export class AutomationNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Automation with id ${id} not found`);
  }
}

export class AutomationUsedByTriggerError extends ConflictError {
  constructor(triggerTitle: string, otherTriggers: number) {
    const others = otherTriggers > 0 ? ` and ${otherTriggers} more` : '';
    super(`Unable to delete automation used in trigger ${triggerTitle}${others}`);
  }
}

export class AutomationUsedByEventError extends ConflictError {
  constructor(rundownId: string, eventId: string) {
    super(`Unable to delete automation used in rundown: ${rundownId}, in event with ID: ${eventId}`);
  }
}
