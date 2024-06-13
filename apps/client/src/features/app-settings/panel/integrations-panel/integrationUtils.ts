import { TimerLifeCycle } from 'ontime-types';

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
];
