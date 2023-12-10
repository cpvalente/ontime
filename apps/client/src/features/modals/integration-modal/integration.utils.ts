import { TimerLifeCycle } from 'ontime-types';

export type OntimeCycle = keyof typeof TimerLifeCycle;

export const sectionText: { [key in TimerLifeCycle]: { title: string; subtitle: string } } = {
  onLoad: {
    title: 'On Load',
    subtitle: 'Triggers when a timer is loaded',
  },
  onStart: {
    title: 'On Start',
    subtitle: 'Triggers when a timer starts',
  },
  onPause: {
    title: 'On Pause',
    subtitle: 'Triggers when a running timer is paused',
  },
  onStop: {
    title: 'On Stop',
    subtitle: 'Triggers when a running timer is stopped',
  },
  onUpdate: {
    title: 'On Every Second',
    subtitle: 'Triggers when a running timer is updated (at least once a second, can be more)',
  },
  onFinish: {
    title: 'On Finish',
    subtitle: 'Triggers when a running reaches 0',
  },
};
