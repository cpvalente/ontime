import { isHTTPOutput, isOSCOutput, isOntimeEvent, timerLifecycleValues } from 'ontime-types';

import { parseAutomation } from '../../api-data/automation/automation.validation.js';
import { demoDb } from '../demoProject.js';

/**
 * The demo ships with automations so the feature is visible on first run.
 * They are hand written literals: nothing in the type system checks that a trigger
 * resolves to an automation, or that the demo cannot reach out to the network.
 */
describe('demo project automations', () => {
  const { automations, triggers } = demoDb.automation;

  it('is enabled, otherwise the automations are invisible', () => {
    expect(demoDb.automation.enabledAutomations).toBe(true);
  });

  it('does not open a listening socket', () => {
    expect(demoDb.automation.enabledOscIn).toBe(false);
  });

  it('keys every automation by its own id', () => {
    for (const [key, automation] of Object.entries(automations)) {
      expect(automation.id).toBe(key);
    }
  });

  it('passes the same validation as a user created automation', () => {
    for (const automation of Object.values(automations)) {
      expect(() => parseAutomation(automation)).not.toThrow();
    }
  });

  it('resolves every global trigger to an automation', () => {
    for (const trigger of triggers) {
      expect(timerLifecycleValues).toContain(trigger.trigger);
      expect(Object.hasOwn(automations, trigger.automationId)).toBe(true);
    }
  });

  it('resolves every event level trigger to an automation', () => {
    for (const rundown of Object.values(demoDb.rundowns)) {
      for (const entry of Object.values(rundown.entries)) {
        if (!isOntimeEvent(entry)) {
          continue;
        }
        for (const trigger of entry.triggers) {
          expect(timerLifecycleValues).toContain(trigger.trigger);
          expect(Object.hasOwn(automations, trigger.automationId)).toBe(true);
        }
      }
    }
  });

  it('never sends outside this machine, whatever the user presses', () => {
    // an automation only fires if something triggers it
    const boundIds = new Set<string>(triggers.map((trigger) => trigger.automationId));
    for (const rundown of Object.values(demoDb.rundowns)) {
      for (const entry of Object.values(rundown.entries)) {
        if (isOntimeEvent(entry)) {
          entry.triggers.forEach((trigger) => boundIds.add(trigger.automationId));
        }
      }
    }

    for (const id of boundIds) {
      for (const output of automations[id].outputs) {
        expect(isOSCOutput(output)).toBe(false);
        expect(isHTTPOutput(output)).toBe(false);
      }
    }
  });
});
