import type { Automation, AutomationDTO, AutomationSettings, NormalisedAutomation, Trigger, TriggerDTO } from 'ontime-types';
import { deleteAtIndex, generateId } from 'ontime-utils';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

/**
 * Gets a copy of the stored automation settings
 */
export function getAutomationSettings(): AutomationSettings {
  return structuredClone(getDataProvider().getAutomation());
}

/**
 * Gets the enabled status of the automations
 */
export function getAutomationsEnabled(): boolean {
  return getAutomationSettings().enabledAutomations;
}

/**
 * Gets a copy of the stored automation triggers
 */
export function getAutomationTriggers(): Trigger[] {
  return getAutomationSettings().triggers;
}

/**
 * Gets a copy of the stored automations
 */
export function getAutomations(): NormalisedAutomation {
  return getAutomationSettings().automations;
}

/**
 * Patches the automation settings object
 */
export function editAutomationSettings(settings: Partial<AutomationSettings>): AutomationSettings {
  saveChanges(settings);
  return getAutomationSettings();
}

/**
 * Adds a validated automation to the store
 */
export function addTrigger(newTrigger: TriggerDTO): Trigger {
  const triggers = getAutomationTriggers();
  const id = getUniqueTriggerId(triggers);
  const trigger = { ...newTrigger, id };
  triggers.push(trigger);
  saveChanges({ triggers });
  return trigger;
}

/**
 * Patches an existing automation trigger
 */
export function editTrigger(id: string, newTrigger: TriggerDTO): Trigger {
  const triggers = getAutomationTriggers();
  const index = triggers.findIndex((trigger) => trigger.id === id);

  if (index === -1) {
    throw new Error(`Automation with id ${id} not found`);
  }

  triggers[index] = { ...triggers[index], ...newTrigger };
  saveChanges({ triggers });
  return triggers[index];
}

/**
 * Deletes an automation trigger given its ID
 */
export function deleteTrigger(id: string): void {
  let triggers = getAutomationTriggers();
  const index = triggers.findIndex((trigger) => trigger.id === id);

  if (index === -1) {
    throw new Error(`Automation with id ${id} not found`);
  }

  triggers = deleteAtIndex(index, triggers);
  saveChanges({ triggers });
}

/**
 * Deletes all project automation triggers
 */
export function deleteAllTriggers(): void {
  saveChanges({ triggers: [] });
}

/**
 * Deletes all project automation triggers and automations
 * We do this together to avoid issues with missing references
 */
export function deleteAll(): void {
  saveChanges({ triggers: [], automations: {} });
}

/**
 * Adds a validated automation to the store
 */
export function addAutomation(newAutomation: AutomationDTO): Automation {
  const automations = getAutomations();
  const id = getUniqueAutomationId(automations);
  automations[id] = { ...newAutomation, id };
  saveChanges({ automations });
  return automations[id];
}

/**
 * Updates an existing automation with a new entry
 */
export function editAutomation(id: string, newAutomation: AutomationDTO): Automation {
  const automations = getAutomations();
  if (!Object.hasOwn(automations, id)) {
    throw new Error(`Automation with id ${id} not found`);
  }

  automations[id] = { ...newAutomation, id };
  saveChanges({ automations });
  return automations[id];
}

/**
 * Deletes a automation given its ID
 */
export function deleteAutomation(id: string): void {
  const automations = getAutomations();
  // ignore request if automation does not exist
  if (!Object.hasOwn(automations, id)) {
    return;
  }
  // prevent deleting a automation that is in use
  const triggers = getAutomationTriggers();
  for (let i = 0; i < triggers.length; i++) {
    const trigger = triggers[i];
    if (trigger.automationId === id) {
      throw new Error(`Unable to delete automation used in trigger ${trigger.title}`);
    }
  }
  delete automations[id];
  saveChanges({ automations });
}

/**
 * Internal utility to patch the automation settings
 */
async function saveChanges(patch: Partial<AutomationSettings>) {
  const automation = getDataProvider().getAutomation();

  // remove undefined keys from object, we probably want a better solution
  Object.keys(patch).forEach((key) => (patch[key] === undefined ? delete patch[key] : {}));
  await getDataProvider().setAutomation({ ...automation, ...patch });
}

/**
 * Returns an ID guaranteed to be unique in an array
 */
function getUniqueTriggerId(triggers: Trigger[]): string {
  let id = '';
  do {
    id = generateId();
  } while (isInArray(id));

  function isInArray(id: string): boolean {
    return triggers.some((trigger) => trigger.id === id);
  }
  return id;
}

/**
 * Returns an ID guaranteed to be unique in an objects keys
 */
function getUniqueAutomationId(automations: NormalisedAutomation): string {
  let id = '';
  do {
    id = generateId();
  } while (Object.hasOwn(automations, id));
  return id;
}
