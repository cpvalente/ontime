import { DatabaseModel, AutomationSettings, Automation, NormalisedAutomationBlueprint } from 'ontime-types';

import { dbModel } from '../../models/dataModel.js';
import type { ErrorEmitter } from '../../utils/parser.js';

export function parseAutomationSettings(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): AutomationSettings {
  if (!data.automation) {
    emitError?.('No data found to import');
    return { ...dbModel.automation };
  }

  return {
    enabledAutomations: data.automation.enabledAutomations ?? dbModel.automation.enabledAutomations,
    enabledOscIn: data.automation.enabledOscIn ?? dbModel.automation.enabledOscIn,
    oscPortIn: data.automation.oscPortIn ?? dbModel.automation.oscPortIn,
    automations: parseAutomations(data.automation.automations),
    blueprints: parseBlueprints(data.automation.blueprints),
  };
}

function parseAutomations(maybeAutomations: unknown): Automation[] {
  if (!Array.isArray(maybeAutomations)) return [];
  return maybeAutomations as Automation[];
}

function parseBlueprints(maybeBlueprint: unknown): NormalisedAutomationBlueprint {
  if (typeof maybeBlueprint !== 'object' || maybeBlueprint === null) return {};
  return maybeBlueprint as NormalisedAutomationBlueprint;
}
