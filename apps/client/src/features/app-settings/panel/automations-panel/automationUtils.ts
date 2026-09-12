import { Automation, AutomationDTO, AutomationFilter, CustomFields, TimerLifeCycle, Trigger } from 'ontime-types';

import { getLifecycleLabel, lifecycleLabels } from '../../../../common/constants/timerLifecycle';

/**
 * Names a trigger created from an automation's lifecycle picker.
 * Shared so a trigger made by the form and one made by a recipe read the same in the list.
 */
export function makeTriggerTitle(automationTitle: string, cycle: TimerLifeCycle): string {
  return `${automationTitle} — ${getLifecycleLabel(cycle)}`;
}

/**
 * Outputs are a union, so react-hook-form cannot resolve a field's error by name.
 * Every output card knows which fields it registered, this just makes them reachable.
 */
export type OutputErrors = Partial<Record<string, { message?: string }>>;

type CycleLabel = {
  label: string;
  value: TimerLifeCycle;
};

export const cycles: CycleLabel[] = [
  { label: lifecycleLabels.onLoad, value: TimerLifeCycle.onLoad },
  { label: lifecycleLabels.onStart, value: TimerLifeCycle.onStart },
  { label: lifecycleLabels.onPause, value: TimerLifeCycle.onPause },
  { label: lifecycleLabels.onStop, value: TimerLifeCycle.onStop },
  { label: lifecycleLabels.onClock, value: TimerLifeCycle.onClock },
  { label: lifecycleLabels.onUpdate, value: TimerLifeCycle.onUpdate },
  { label: lifecycleLabels.onFinish, value: TimerLifeCycle.onFinish },
  { label: lifecycleLabels.onWarning, value: TimerLifeCycle.onWarning },
  { label: lifecycleLabels.onDanger, value: TimerLifeCycle.onDanger },
];

/**
 * Filter operators offered in the automation form
 * NOTE: not_contains is supported by the type and by the runtime, but the server
 * validation list omits it, so an automation using it cannot be saved.
 * It stays out of the UI until the server accepts it.
 */
export const operators: Array<{ value: AutomationFilter['operator']; label: string }> = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
];

/**
 * We use this guard to find out if the form is receiving an existing automation or creating a DTO
 * We do this by checking whether an ID has been generated
 */
export function isAutomation(automation: AutomationDTO | Automation): automation is Automation {
  return Object.hasOwn(automation, 'id');
}

const staticSelectProperties = [
  { value: null, label: 'Select field' },
  { value: 'eventNow.id', label: 'ID' },
  { value: 'eventNow.title', label: 'Title' },
  { value: 'eventNow.cue', label: 'Cue' },
  { value: 'eventNow.countToEnd', label: 'Count to end' },
  { value: 'eventNow.note', label: 'Note' },
  { value: 'eventNow.colour', label: 'Colour' },
];

const staticNextSelectProperties = [
  { value: 'eventNext.id', label: 'Next ID' },
  { value: 'eventNext.title', label: 'Next Title' },
  { value: 'eventNext.cue', label: 'Next Cue' },
];

type SelectableField = {
  value: string | null; // string encodes path in runtime state object
  label: string;
};

export function makeFieldList(customFields: CustomFields): SelectableField[] {
  return [
    ...staticSelectProperties,
    ...Object.entries(customFields).map(([key, { label }]) => ({
      value: `eventNow.custom.${key}`,
      label: `Custom: ${label}`,
    })),
    ...staticNextSelectProperties,
    ...Object.entries(customFields).map(([key, { label }]) => ({
      value: `eventNext.custom.${key}`,
      label: `Next custom: ${label}`,
    })),
  ];
}

/**
 * We warn the user if they have created multiple links between the same automation and a trigger
 */
export function checkDuplicates(triggers: Trigger[]) {
  const seen = new Set<string>();
  const duplicates: number[] = [];

  for (const [index, trigger] of triggers.entries()) {
    const key = `${trigger.trigger}:${trigger.automationId}`;

    if (seen.has(key)) {
      duplicates.push(index);
    } else {
      seen.add(key);
    }
  }

  return duplicates.length > 0 ? duplicates : undefined;
}

/**
 * Groups the lifecycles each automation is bound to
 * Used to show when an automation runs, and to highlight the ones that never will
 */
export function groupTriggersByAutomation(triggers: Trigger[]): Record<string, TimerLifeCycle[]> {
  const grouped: Record<string, TimerLifeCycle[]> = {};

  for (const trigger of triggers) {
    if (!Object.hasOwn(grouped, trigger.automationId)) {
      grouped[trigger.automationId] = [];
    }
    // the runtime fires an automation once per lifecycle, duplicates would be noise here
    if (!grouped[trigger.automationId].includes(trigger.trigger)) {
      grouped[trigger.automationId].push(trigger.trigger);
    }
  }

  return grouped;
}
