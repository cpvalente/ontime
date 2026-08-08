import {
  type Automation,
  type AutomationFilter,
  type AutomationOutput,
  type FilterRule,
  LogOrigin,
  MessageTag,
  RuntimeStore,
  TimerLifeCycle,
  isHTTPOutput,
  isOSCOutput,
  isOntimeAction,
} from 'ontime-types';
import { getPropertyFromPath } from 'ontime-utils';

import { socket } from '../../adapters/WebsocketAdapter.js';
import { logger } from '../../classes/Logger.js';
import { isOntimeCloud } from '../../setup/environment.js';
import { eventStore } from '../../stores/EventStore.js';
import { getAutomationTriggers, getAutomations, getAutomationsEnabled } from './automation.dao.js';
import { isContained, isEquivalent, isGreaterThan, isLessThan, summariseOutputs } from './automation.utils.js';
import { emitHTTP } from './clients/http.client.js';
import { toOntimeAction } from './clients/ontime.client.js';
import { emitOSC } from './clients/osc.client.js';

/**
 * Lifecycles that fire continuously while the timer runs.
 * The logger queue holds 100 entries, so logging every onClock fire would evict
 * everything else within two minutes and make the log useless.
 */
const continuousCycles: TimerLifeCycle[] = [TimerLifeCycle.onClock, TimerLifeCycle.onUpdate];

/** floor between two reports about the same automation, in milliseconds */
const reportThrottleMs = 1000;

/** automations we have already warned about being bound to a continuous lifecycle */
const suppressionNotices = new Set<string>();
/** last time we logged a given automation + cycle pair */
const lastLoggedAt = new Map<string, number>();
/** last time we told the clients about a given automation */
const lastReportedAt = new Map<string, number>();

/**
 * Clears the reporting state.
 * Called when the runtime stops, so the next run reports from scratch rather than
 * inheriting throttles from the last one
 */
export function resetAutomationLogState() {
  suppressionNotices.clear();
  lastLoggedAt.clear();
  lastReportedAt.clear();
}

/**
 * Exposes a method for triggering actions based on a TimerLifeCycle event
 */
export function triggerAutomations(cycle: TimerLifeCycle) {
  if (!getAutomationsEnabled()) {
    return;
  }

  fireForCycle(cycle);

  // A stop ends a run, so the next one reports from scratch. This deliberately does not
  // happen on load: loading is not rare, roll mode loads at every event boundary, and
  // resetting there would re-emit the suppression notice once per cue, which is the
  // flooding the notice exists to prevent.
  // It sits out here because fireForCycle returns early when nothing is bound to onStop,
  // which is the common case
  if (cycle === TimerLifeCycle.onStop) {
    resetAutomationLogState();
  }
}

function fireForCycle(cycle: TimerLifeCycle) {
  const store = eventStore.poll();

  let triggers = getAutomationTriggers();

  // get triggers from event
  if (store.eventNow?.triggers) {
    triggers = triggers.concat(store.eventNow.triggers);
  }

  // note: there are no onStop triggers in event
  const filteredTrigger = triggers.filter((trigger) => trigger.trigger === cycle);
  if (filteredTrigger.length === 0) {
    return;
  }

  const automations = getAutomations();
  if (Object.keys(automations).length === 0) {
    return;
  }

  // deduplicate — if the same automation appears multiple times on one lifecycle, fire it once
  const seen = new Set<string>();
  const uniqueTriggers = filteredTrigger.filter((t) => {
    if (seen.has(t.automationId)) return false;
    seen.add(t.automationId);
    return true;
  });

  uniqueTriggers.forEach((trigger) => {
    const automation = automations[trigger.automationId];
    if (!automation || automation.outputs.length === 0) {
      return;
    }
    const shouldSend = testConditions(automation.filters, automation.filterRule, store);
    if (shouldSend) {
      send(automation.outputs, store);
      reportFired(trigger.automationId, automation, cycle);
    }
  });
}

/**
 * Makes a successful automation visible, which it previously was not:
 * the log answers what happened, the socket message answers whether an automation is alive
 */
function reportFired(automationId: string, automation: Automation, cycle: TimerLifeCycle) {
  const now = Date.now();

  // the panel shows a last fired time, so continuous lifecycles still report, but at most once a second
  const lastReported = lastReportedAt.get(automationId);
  if (lastReported === undefined || now - lastReported >= reportThrottleMs) {
    lastReportedAt.set(automationId, now);
    socket.sendAsJson(MessageTag.AutomationFired, { automationId, cycle });
  }

  if (continuousCycles.includes(cycle)) {
    // one notice per load is enough to explain why the log goes quiet from here
    if (!suppressionNotices.has(automationId)) {
      suppressionNotices.add(automationId);
      logger.info(
        LogOrigin.Automation,
        `${automation.title} is bound to ${cycle} and fires continuously, per-fire logging suppressed`,
      );
    }
    return;
  }

  // a rapid reload can fire the same automation on the same cycle several times over
  const logKey = `${automationId}:${cycle}`;
  const lastLogged = lastLoggedAt.get(logKey);
  if (lastLogged !== undefined && now - lastLogged < reportThrottleMs) {
    return;
  }
  lastLoggedAt.set(logKey, now);

  logger.info(LogOrigin.Automation, `${automation.title} fired on ${cycle} → ${summariseOutputs(automation.outputs)}`);
}

/**
 * Exposes a method for bypassing the condition check and testing the sending of an output
 */
export function testOutput(payload: AutomationOutput) {
  const store = eventStore.poll();
  send([payload], store);
}

/**
 * Checks whether the automation conditions are met
 */
export function testConditions(
  filters: AutomationFilter[],
  filterRule: FilterRule,
  store: Partial<RuntimeStore>,
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
    const fieldValue = getPropertyFromPath(field, store);

    // if value is empty string, the user could be meaning to check if the value does not exist
    // we use loose equality to be able to check for converted values (eg '10' == 10)
    switch (operator) {
      case 'equals':
        return isEquivalent(fieldValue, lowerCasedValue);
      case 'not_equals':
        return !isEquivalent(fieldValue, lowerCasedValue);
      case 'greater_than':
        return isGreaterThan(fieldValue, value);
      case 'less_than':
        return isLessThan(fieldValue, value);
      case 'contains':
        return isContained(fieldValue, lowerCasedValue);
      case 'not_contains':
        return !isContained(fieldValue, lowerCasedValue);
      default: {
        operator satisfies never;
        return false;
      }
    }
  }
}

/**
 * Handles preparing and sending of the data
 * Returns a boolean indicating whether a message was sent
 */
function send(output: AutomationOutput[], store: RuntimeStore) {
  output.forEach((payload) => {
    if (isOSCOutput(payload) && !isOntimeCloud) {
      emitOSC(payload, store);
    } else if (isHTTPOutput(payload)) {
      emitHTTP(payload, store);
    } else if (isOntimeAction(payload)) {
      toOntimeAction(payload, store);
    } else {
      logger.warning(LogOrigin.Tx, `Unknown output type: ${payload}`);
    }
  });
}
