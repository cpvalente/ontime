import {
  isHTTPOutput,
  isOSCOutput,
  type AutomationFilter,
  type AutomationOutput,
  type FilterRule,
  type RuntimeStore,
  type TimerLifeCycle,
} from 'ontime-types';

import { getState, type RuntimeState } from '../../stores/runtimeState.js';

import { emitOSC } from './clients/osc.client.js';
import { emitHTTP } from './clients/http.client.js';
import { getAutomations, getAutomationsEnabled, getBlueprints } from './automation.dao.js';
import { isOntimeCloud } from '../../externals.js';

/**
 * Exposes a method for triggering actions based on a TimerLifeCycle event
 */
export function triggerAutomations(event: TimerLifeCycle, state: RuntimeState) {
  if (!getAutomationsEnabled()) {
    return;
  }

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

export function testOutput(payload: AutomationOutput) {
  send([payload]);
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

    // TODO: if value is empty string, the user could be meaning to check if the value does not exist
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
function send(output: AutomationOutput[], state?: RuntimeState) {
  const stateSnapshot = state ?? getState();
  output.forEach((payload) => {
    if (isOSCOutput(payload)) {
      if (!isOntimeCloud) {
        emitOSC(payload, stateSnapshot);
      }
    } else if (isHTTPOutput(payload)) {
      emitHTTP(payload, stateSnapshot);
    }
  });
}
