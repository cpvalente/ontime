import {
  isHTTPOutput,
  isOntimeAction,
  isOSCOutput,
  LogOrigin,
  TimerLifeCycle,
  type AutomationFilter,
  type AutomationOutput,
  type FilterRule,
} from 'ontime-types';
import { getPropertyFromPath } from 'ontime-utils';

import { logger } from '../../classes/Logger.js';
import { getState, type RuntimeState } from '../../stores/runtimeState.js';
import { isOntimeCloud } from '../../externals.js';

import { emitOSC } from './clients/osc.client.js';
import { emitHTTP } from './clients/http.client.js';
import { getAutomationsEnabled, getAutomations, getAutomationTriggers } from './automation.dao.js';
import { isBooleanEquals, isGreaterThan, isLessThan } from './automation.utils.js';
import { toOntimeAction } from './clients/ontime.client.js';

/**
 * Exposes a method for triggering actions based on a TimerLifeCycle event
 */
export function triggerAutomations(cycle: TimerLifeCycle, state: RuntimeState) {
  if (!getAutomationsEnabled()) {
    return;
  }

  let triggers = getAutomationTriggers();

  if (state.eventNow && state.eventNow.triggers) {
    triggers = triggers.concat(state.eventNow.triggers);
  } //TODO: onStop dosn't work in the current way of implementing

  const triggerAutomations = triggers.filter((trigger) => trigger.trigger === cycle);
  if (triggerAutomations.length === 0) {
    return;
  }

  const automations = getAutomations();
  if (Object.keys(automations).length === 0) {
    return;
  }

  triggerAutomations.forEach((trigger) => {
    const automation = automations[trigger.automationId];
    if (!automation || automation.outputs.length === 0) {
      return;
    }
    const shouldSend = testConditions(automation.filters, automation.filterRule, state);
    if (shouldSend) {
      send(automation.outputs, state);
    }
  });
}

/**
 * Exposes a method for bypassing the condition check and testing the sending of an output
 */
export function testOutput(payload: AutomationOutput) {
  send([payload]);
}

/**
 * Checks whether the automation conditions are met
 */
export function testConditions(
  filters: AutomationFilter[],
  filterRule: FilterRule,
  state: Partial<RuntimeState>,
): boolean {
  if (filters.length === 0) {
    return true;
  }

  if (filterRule === 'all') {
    return filters.every(evaluateCondition);
  }

  return filters.some(evaluateCondition);

  function evaluateCondition(filter: AutomationFilter): boolean {
    const { field, operator, value } = filter;
    const lowerCasedValue = value.toLowerCase();
    const fieldValue = getPropertyFromPath(field, state);

    // if value is empty string, the user could be meaning to check if the value does not exist
    // we use loose equality to be able to check for converted values (eg '10' == 10)
    switch (operator) {
      case 'equals':
        // handle the case where we are comparing boolean strings
        if (typeof fieldValue === 'boolean') {
          return isBooleanEquals(fieldValue, lowerCasedValue);
        }
        // make string comparisons case insensitive
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase() === lowerCasedValue;
        }
        // overload the edge case where we use empty string to check if a value does not exist
        if (value === '' && fieldValue === undefined) {
          return true;
        }
        return fieldValue == value;
      case 'not_equals':
        return fieldValue != value;
      case 'greater_than':
        return isGreaterThan(fieldValue, value);
      case 'less_than':
        return isLessThan(fieldValue, value);
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
    if (isOSCOutput(payload) && !isOntimeCloud) {
      emitOSC(payload, stateSnapshot);
    } else if (isHTTPOutput(payload)) {
      emitHTTP(payload, stateSnapshot);
    } else if (isOntimeAction(payload)) {
      toOntimeAction(payload);
    } else {
      logger.warning(LogOrigin.Tx, `Unknown output type: ${payload}`);
    }
  });
}
