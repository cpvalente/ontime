import { TimerLifeCycle } from 'ontime-types';

export type TimerLifeCycleKey = keyof typeof TimerLifeCycle;

export default interface IIntegration<T> {
  subscriptions: T[];
  init: (config: unknown) => void;
  dispatch: (action: TimerLifeCycleKey, state?: object) => void;
  emit: (...args: unknown[]) => unknown;
  shutdown: () => void;
}
