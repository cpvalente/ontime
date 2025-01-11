import { DatabaseModel, AutomationSettings, Automation, NormalisedAutomationBlueprint } from 'ontime-types';

import { dbModel } from '../../models/dataModel.js';
import type { ErrorEmitter } from '../../utils/parser.js';

interface LegacyData extends Partial<DatabaseModel> {
  http?: unknown;
  osc?: {
    enabledIn?: boolean;
    portIn?: number;
  };
}

export function parseAutomationSettings(data: LegacyData, emitError?: ErrorEmitter): AutomationSettings {
  /**
   * Leaving a path for migrating users to the new automations
   * This should be removed after a few releases
   */
  if (data.http || data.osc) {
    emitError?.('Found legacy integrations');
    console.log('Found legacy integrations...');
    if (data.osc) {
      return {
        enabledAutomations: dbModel.automation.enabledAutomations,
        enabledOscIn: data.osc?.enabledIn ?? dbModel.automation.enabledOscIn,
        oscPortIn: data.osc?.portIn ?? dbModel.automation.oscPortIn,
        automations: [],
        blueprints: {},
      };
    } else {
      return { ...dbModel.automation };
    }
  }

  if (!data.automation) {
    emitError?.('No data found to import');
    return { ...dbModel.automation };
  }
  console.log('Found Automation settings, importing...');

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
