import type { TimerLifeCycle } from 'ontime-types';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

type FiredRecord = { at: number; cycle: TimerLifeCycle };

type AutomationFiredStore = {
  fired: Record<string, FiredRecord>;
};

/**
 * Tracks when each automation last ran.
 * Ephemeral by design: this is runtime feedback for the settings panel, not project data,
 * and it is fed by a socket message the server already coalesces to once a second per automation
 */
const automationFired = createStore<AutomationFiredStore>(() => ({
  fired: {},
}));

export const useAutomationFired = () => useStore(automationFired);

export const addAutomationFired = (automationId: string, cycle: TimerLifeCycle) =>
  automationFired.setState((state) => ({
    fired: { ...state.fired, [automationId]: { at: Date.now(), cycle } },
  }));
