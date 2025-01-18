import {
  Automation,
  AutomationBlueprint,
  AutomationBlueprintDTO,
  CustomFields,
  OntimeEvent,
  TimerLifeCycle,
} from 'ontime-types';

type CycleLabel = {
  id: number;
  label: string;
  value: keyof typeof TimerLifeCycle;
};

export const cycles: CycleLabel[] = [
  { id: 1, label: 'On Load', value: 'onLoad' },
  { id: 2, label: 'On Start', value: 'onStart' },
  { id: 3, label: 'On Pause', value: 'onPause' },
  { id: 4, label: 'On Stop', value: 'onStop' },
  { id: 5, label: 'Every second', value: 'onClock' },
  { id: 6, label: 'On Timer Update', value: 'onUpdate' },
  { id: 7, label: 'On Finish', value: 'onFinish' },
  { id: 8, label: 'On Warning', value: 'onWarning' },
  { id: 9, label: 'On Danger', value: 'onDanger' },
];

/**
 * We use this guard to find out if the form is receiving an existing blueprint or creating a DTO
 * We do this by checking whether an ID has been generated
 */
export function isBlueprint(blueprint: AutomationBlueprintDTO | AutomationBlueprint): blueprint is AutomationBlueprint {
  return Object.hasOwn(blueprint, 'id');
}

export const staticSelectProperties = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Title' },
  { value: 'cue', label: 'Cue' },
  { value: 'countToEnd', label: 'Count to end' },
  { value: 'isPublic', label: 'Is public' },
  { value: 'skip', label: 'Skip' },
  { value: 'note', label: 'Note' },
  { value: 'colour', label: 'Colour' },
  { value: 'endAction', label: 'End action' },
  { value: 'timerType', label: 'Timer type' },
  { value: 'timeWarning', label: 'Time warning' },
  { value: 'timeDanger', label: 'Time danger' },
];

type SelectableField = {
  value: keyof OntimeEvent | string; // string for custom fields
  label: string;
};

export function makeFieldList(customFields: CustomFields): SelectableField[] {
  return [
    ...staticSelectProperties,
    ...Object.entries(customFields).map(([key, { label }]) => ({ value: key, label: `Custom: ${label}` })),
  ];
}

/**
 * We warn the user if they have created multiple links between the same blueprint and automation
 */
export function checkDuplicates(automations: Automation[]) {
  const automationMap: Record<string, string[]> = {};
  const duplicates = [];

  for (let i = 0; i < automations.length; i++) {
    const automation = automations[i];
    if (!Object.hasOwn(automationMap, automation.trigger)) {
      automationMap[automation.trigger] = [];
    }

    if (automationMap[automation.trigger].includes(automation.blueprintId)) {
      duplicates.push(i);
    } else {
      automationMap[automation.trigger].push(automation.blueprintId);
    }
  }
  return duplicates.length > 0 ? duplicates : undefined;
}
