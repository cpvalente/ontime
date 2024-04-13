import type { TimerLifeCycleKey } from './TimerLifecycle.type.js';

export type HttpSubscription = { id: string; cycle: TimerLifeCycleKey; message: string; enabled: boolean };

export interface HttpSettings {
  enabledOut: boolean;
  subscriptions: HttpSubscription[];
}
