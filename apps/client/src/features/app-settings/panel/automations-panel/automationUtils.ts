import { Automation, AutomationDTO, AutomationFilter, CustomFields, TimerLifeCycle, Trigger } from 'ontime-types';

import { lifecycleLabels } from '../../../../common/constants/timerLifecycle';

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

export type OutputErrors = Partial<Record<string, { message?: string }>>;

export const operators: Array<{ value: AutomationFilter['operator']; label: string }> = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
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
