import { RuntimeStore, TimerLifeCycle } from 'ontime-types';

import { eventStore } from '../../stores/EventStore.js';

import { emitOSC } from './clients/osc.client.js';
import { emitHTTP } from './clients/http.client.js';
import { emitCompanion } from './clients/companion.client.js';

export type FilterRule = 'all' | 'any';
export type Automation = {
  id: string;
  title: string;
  filterRule: FilterRule;
  trigger: TimerLifeCycle;
  filter: AutomationFilter[];
  output: AutomationOutput[];
};

export type AutomationFilter = {
  field: string; // this should be a key of a OntimeEvent + custom fields
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: string; // we use string but would coerce to the field value
};

export type AutomationOutput = OSCOutput | HTTPOutput | CompanionOutput;

export type OSCOutput = {
  type: 'osc';
  targetIP: string;
  targetPort: number;
  address: string;
  args: number | string;
};

export type HTTPOutput = {
  type: 'http';
  targetIP: string;
  address: string;
};

export type CompanionOutput = {
  type: 'companion';
  targetIP: string;
  address: string;
  page: number;
  bank: number;
};

let automations: Automation[] = [];

export function clearAutomations(): Automation[] {
  automations = [];
  return automations;
}

export function getAutomations(): Automation[] {
  return automations;
}

/**
 * Receives a list of automation, which is parsed, validated and normalised
 * @param automations
 */
export function addAutomations(newAutomations: Automation[]) {
  automations.push(...newAutomations);
  return automations;
}

/**
 * Exposes a method for triggering actions based on a TimerLifeCycle event
 */
export function deleteAutomation(id: string) {
  automations = automations.filter((automation) => automation.id !== id);
  return automations;
}

/**
 * Exposes a method for triggering actions based on a TimerLifeCycle event
 */
export function editAutomation(id: string, newAutomation: Automation) {
  for (let i = 0; i < automations.length; i++) {
    const automation = automations[i];
    if (automation.id === id) {
      automations[i] = newAutomation;
      break;
    }
  }
  return automations;
}

/**
 * Exposes a method for triggering actions based on a TimerLifeCycle event
 */
export function triggerAction(event: TimerLifeCycle) {
  const triggerAutomations = automations.filter((automation) => automation.trigger === event);
  if (triggerAutomations.length === 0) {
    return;
  }

  const state = eventStore.poll();
  triggerAutomations.forEach((automation) => {
    if (automation.output.length === 0) {
      return;
    }
    const shouldSend = testConditions(automation.filter, automation.filterRule, state);
    if (shouldSend) {
      send(automation.output, state);
    }
  });
}

export function testOutput(payload: AutomationOutput) {
  const state = eventStore.poll();
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
    if (payload.type === 'companion') {
      emitCompanion();
      return true;
    }
    return false;
  });
  return true;
}
