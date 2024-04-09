import { TimerLifeCycle } from 'ontime-types';

export type TimerLifeCycleKey = keyof typeof TimerLifeCycle;

export default interface IIntegration<T, C> {
  subscriptions: T[];
  init: (config: C) => void;
  dispatch: (action: TimerLifeCycleKey, state?: object) => void;
  emit: (...args: never[]) => unknown;
  shutdown: () => void;
}
