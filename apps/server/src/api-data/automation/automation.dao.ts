import type {
  Automation,
  AutomationBlueprint,
  AutomationBlueprintDTO,
  AutomationDTO,
  AutomationSettings,
  NormalisedAutomationBlueprint,
} from 'ontime-types';
import { deleteAtIndex, generateId } from 'ontime-utils';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

/**
 * Gets a copy of the stored automation settings
 */
export function getAutomationSettings(): AutomationSettings {
  return structuredClone(getDataProvider().getAutomation());
}

/**
 * Gets a copy of the stored automations
 */
export function getAutomations(): Automation[] {
  return getAutomationSettings().automations;
}

/**
 * Gets a copy of the stored blueprints
 */
export function getBlueprints(): NormalisedAutomationBlueprint {
  return getAutomationSettings().blueprints;
}

export function editAutomationSettings(settings: Partial<AutomationSettings>): AutomationSettings {
  saveChanges(settings);
  return getAutomationSettings();
}

/**
 * Adds a validated automation to the store
 */
export function addAutomation(newAutomation: AutomationDTO): Automation {
  const automations = getAutomations();
  const id = getUniqueAutomationId(automations);
  const automation = { ...newAutomation, id };
  automations.push(automation);
  saveChanges({ automations });
  return automation;
}

/**
 * Patches an existing automation
 */
export function editAutomation(id: string, newAutomation: AutomationDTO): Automation {
  const automations = getAutomations();
  const index = automations.findIndex((automation) => automation.id === id);

  if (index === -1) {
    throw new Error(`Automation with id ${id} not found`);
  }

  automations[index] = { ...automations[index], ...newAutomation };
  saveChanges({ automations });
  return automations[index];
}

/**
 * Deletes an automation given its ID
 */
export function deleteAutomation(id: string): void {
  let automations = getAutomations();
  const index = automations.findIndex((automation) => automation.id === id);

  if (index === -1) {
    throw new Error(`Automation with id ${id} not found`);
  }

  automations = deleteAtIndex(index, automations);
  saveChanges({ automations });
}

/**
 * Deletes all project automations
 */
export function deleteAllAutomations(): void {
  saveChanges({ automations: [] });
}

/**
 * Deletes all project automations and blueprints
 * We do this together to avoid issues with missing references
 */
export function deleteAll(): void {
  saveChanges({ automations: [], blueprints: {} });
}

/**
 * Adds a validated blueprint to the store
 */
export function addBlueprint(newBlueprint: Omit<AutomationBlueprint, 'id'>): AutomationBlueprint {
  const blueprints = getBlueprints();
  const id = getUniqueBlueprintId(blueprints);
  blueprints[id] = { ...newBlueprint, id };
  saveChanges({ blueprints });
  return blueprints[id];
}

/**
 * Updates an existing blueprint with a new entry
 */
export function editBlueprint(id: string, newBlueprint: AutomationBlueprintDTO): AutomationBlueprint {
  const blueprints = getBlueprints();
  if (!Object.hasOwn(blueprints, id)) {
    throw new Error(`Blueprint with id ${id} not found`);
  }

  blueprints[id] = { ...newBlueprint, id };
  saveChanges({ blueprints });
  return blueprints[id];
}

/**
 * Deletes a blueprint given its ID
 */
export function deleteBlueprint(id: string): void {
  const blueprints = getBlueprints();
  // ignore request if blueprint does not exist
  if (!Object.hasOwn(blueprints, id)) {
    return;
  }
  // prevent deleting a blueprint that is in use
  const automations = getAutomations();
  for (let i = 0; i < automations.length; i++) {
    const automation = automations[i];
    if (automation.blueprintId === id) {
      throw new Error(`Unable to delete blueprint used in automation ${automation.title}`);
    }
  }
  delete blueprints[id];
  saveChanges({ blueprints });
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
function getUniqueAutomationId(automations: Automation[]): string {
  let id = '';
  do {
    id = generateId();
  } while (isInArray(id));

  function isInArray(id: string): boolean {
    return automations.some((automation) => automation.id === id);
  }
  return id;
}

/**
 * Returns an ID guaranteed to be unique in an objects keys
 */
function getUniqueBlueprintId(blueprints: NormalisedAutomationBlueprint): string {
  let id = '';
  do {
    id = generateId();
  } while (Object.hasOwn(blueprints, id));
  return id;
}
