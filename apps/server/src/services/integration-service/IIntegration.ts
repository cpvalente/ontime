import TimerLifeCycle from '../../@types/TimerLifecycle.types.js';

export type TimerLifeCycleKey = keyof typeof TimerLifeCycle;
type BaseSubscriptions = { [key in TimerLifeCycleKey]?: unknown };

export default interface IIntegration {
  subscriptions: BaseSubscriptions;
  init: (config: unknown) => OperationReturn;
  dispatch: (action: string, state?: object) => OperationReturn;
  emit: (...args: unknown[]) => unknown;
  shutdown: () => void;
}

// either went well, or explain what failed
type OperationReturn = ReturnOnSuccess | ReturnOnError;

type ReturnOnSuccess = {
  success: true;
  message?: string;
};

type ReturnOnError = {
  success: false;
  message: string;
};
