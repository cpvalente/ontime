import { Automation, AutomationDTO, AutomationFilter, CustomFields, TimerLifeCycle, Trigger } from 'ontime-types';

import { lifecycleLabels } from '../../../../common/constants/timerLifecycle';

type CycleLabel = {
  id: number;
  label: string;
  value: keyof typeof TimerLifeCycle;
};

export const cycles: CycleLabel[] = [
  { id: 1, label: lifecycleLabels.onLoad, value: 'onLoad' },
  { id: 2, label: lifecycleLabels.onStart, value: 'onStart' },
  { id: 3, label: lifecycleLabels.onPause, value: 'onPause' },
  { id: 4, label: lifecycleLabels.onStop, value: 'onStop' },
  { id: 5, label: lifecycleLabels.onClock, value: 'onClock' },
  { id: 6, label: lifecycleLabels.onUpdate, value: 'onUpdate' },
  { id: 7, label: lifecycleLabels.onFinish, value: 'onFinish' },
  { id: 8, label: lifecycleLabels.onWarning, value: 'onWarning' },
  { id: 9, label: lifecycleLabels.onDanger, value: 'onDanger' },
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
  const triggersMap: Record<string, string[]> = {};
  const duplicates = [];

  for (let i = 0; i < triggers.length; i++) {
    const trigger = triggers[i];
    if (!Object.hasOwn(triggersMap, trigger.trigger)) {
      triggersMap[trigger.trigger] = [];
    }

    if (triggersMap[trigger.trigger].includes(trigger.automationId)) {
      duplicates.push(i);
    } else {
      triggersMap[trigger.trigger].push(trigger.automationId);
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
