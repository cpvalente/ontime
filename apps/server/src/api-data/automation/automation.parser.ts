import { AutomationSettings, DatabaseModel, NormalisedAutomation, Trigger } from 'ontime-types';

import { getPartialProject } from '../../models/dataModel.js';
import type { ErrorEmitter } from '../../utils/parserUtils.js';

export function parseAutomationSettings(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): AutomationSettings {
  const defaultAutomation: AutomationSettings = getPartialProject('automation');

  if (!data.automation) {
    emitError?.('No data found to import');
    return defaultAutomation;
  }
  console.log('Found Automation settings, importing...');

  return {
    enabledAutomations: data.automation.enabledAutomations ?? defaultAutomation.enabledAutomations,
    enabledOscIn: data.automation.enabledOscIn ?? defaultAutomation.enabledOscIn,
    oscPortIn: data.automation.oscPortIn ?? defaultAutomation.oscPortIn,
    triggers: parseTriggers(data.automation.triggers),
    automations: parseAutomations(data.automation.automations),
  };
}

function parseTriggers(maybeAutomations: unknown): Trigger[] {
  if (!Array.isArray(maybeAutomations)) return [];
  return maybeAutomations as Trigger[];
}

function parseAutomations(maybeAutomation: unknown): NormalisedAutomation {
  if (typeof maybeAutomation !== 'object' || maybeAutomation === null) return {};
  return maybeAutomation as NormalisedAutomation;
}
