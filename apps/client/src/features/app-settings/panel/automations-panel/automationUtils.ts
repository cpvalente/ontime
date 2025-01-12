import { Automation, TimerLifeCycle } from 'ontime-types';

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
  { id: 5, label: 'On Timer Update', value: 'onUpdate' },
  { id: 6, label: 'On Finish', value: 'onFinish' },
  { id: 7, label: 'On Warning', value: 'onWarning' },
  { id: 8, label: 'On Danger', value: 'onDanger' },
];

export const field = [
  { id: 1, label: 'Cue', value: 'cue' },
  { id: 2, label: 'Title', value: 'title' },
  { id: 3, label: 'Note', value: 'note' },
  { id: 4, label: 'Custom', value: 'cue' },
  { id: 5, label: 'Cue', value: 'cue' },
  { id: 6, label: 'Cue', value: 'cue' },
  { id: 7, label: 'Cue', value: 'cue' },
];

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
