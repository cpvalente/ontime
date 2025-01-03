import type { AutomationFilter, AutomationOutput, FilterRule, RuntimeStore, TimerLifeCycle } from 'ontime-types';

import { emitOSC } from './clients/osc.client.js';
import { emitHTTP } from './clients/http.client.js';
import { getAutomations, getBlueprints } from './automation.dao.js';

/**
 * Exposes a method for triggering actions based on a TimerLifeCycle event
 */
export function triggerAction(event: TimerLifeCycle, state: Partial<RuntimeStore>) {
  const automations = getAutomations();
  const triggerAutomations = automations.filter((automation) => automation.trigger === event);
  if (triggerAutomations.length === 0) {
    return;
  }

  const blueprints = getBlueprints();
  if (Object.keys(blueprints).length === 0) {
    return;
  }

  triggerAutomations.forEach((automation) => {
    const blueprint = blueprints[automation.blueprintId];
    if (!blueprint) {
      return;
    }
    const shouldSend = testConditions(blueprint.filters, blueprint.filterRule, state);
    if (shouldSend) {
      send(blueprint.outputs, state);
    }
  });
}

export function testOutput(payload: AutomationOutput, state: Partial<RuntimeStore>) {
  const success = send([payload], state);
  if (!success) {
    throw new Error('Failed to send output');
  }
}

/**
 * Checks whether the automation conditions are met
 */
export function testConditions(
  filters: AutomationFilter[],
  filterRule: FilterRule,
  state: Partial<RuntimeStore>,
): boolean {
  if (filters.length === 0) {
    return true;
  }

  if (filterRule === 'all') {
    return filters.every((filter) => evaluateCondition(filter));
  }

  return filters.some((filter) => evaluateCondition(filter));

  function evaluateCondition(filter: AutomationFilter): boolean {
    const { field, operator, value } = filter;
    const fieldValue = state[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return fieldValue > value;
      case 'less_than':
        return fieldValue < value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(value);
      case 'not_contains':
        return typeof fieldValue === 'string' && !fieldValue.includes(value);
      default:
        return false;
    }
  }
}

/**
 * Handles preparing and sending of the data
 * Returns a boolean indicating whether a message was sent
 */
function send(output: AutomationOutput[], _state: Partial<RuntimeStore>): boolean {
  output.forEach((payload) => {
    if (payload.type === 'osc') {
      emitOSC();
      return true;
    }
    if (payload.type === 'http') {
      emitHTTP();
      return true;
    }
    return false;
  });
  return true;
}
