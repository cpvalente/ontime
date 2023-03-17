import { TimerLifeCycle } from './TimerLifecycle.type.js';

export type TimerLifeCycleKey = keyof typeof TimerLifeCycle;
export type OscSubscriptionOptions = { id: string; message: string; enabled: boolean }
export type OscSubscription = { [key in TimerLifeCycleKey]: OscSubscriptionOptions[] };

export interface OSCSettings {
  portIn: number;
  portOut: number;
  targetIP: string;
  enabledIn: boolean;
  enabledOut: boolean;
  subscriptions: OscSubscription;
}
