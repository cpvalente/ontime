import type { Automation } from 'ontime-types';

import { addAutomation, addTrigger, deleteAutomation, deleteTrigger } from '../../../../../common/api/automation';
import { cycles } from '../automationUtils';
import type { AutomationRecipe } from './automationRecipes';

/**
 * Installs a recipe as an ordinary automation, using the same endpoints as the form.
 * There is nothing special about the result: the user owns it and can edit or delete it.
 *
 * The server generates the ids, so the automation has to exist before its triggers can
 * point at it. If a trigger fails half way we undo the whole thing, triggers first:
 * the server refuses to delete an automation that is still referenced.
 */
export async function installRecipe(recipe: AutomationRecipe): Promise<Automation> {
  const created = await addAutomation(recipe.automation);
  const createdTriggerIds: string[] = [];

  try {
    for (const cycle of recipe.triggers) {
      const label = cycles.find(({ value }) => value === cycle)?.label ?? cycle;
      const trigger = await addTrigger({
        title: `${recipe.automation.title} — ${label}`,
        trigger: cycle,
        automationId: created.id,
      });
      createdTriggerIds.push(trigger.id);
    }
  } catch (error) {
    await rollback(created.id, createdTriggerIds);
    throw error;
  }

  return created;
}

async function rollback(automationId: string, triggerIds: string[]) {
  try {
    for (const id of triggerIds) {
      await deleteTrigger(id);
    }
    await deleteAutomation(automationId);
  } catch (_error) {
    // the install already failed and we are reporting that. A failed cleanup leaves an
    // editable automation behind, which is recoverable, so it should not mask the original error
  }
}
