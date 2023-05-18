import { TimerLifeCycleKey } from './TimerLifecycle.type.js';

export type OscSubscriptionOptions = { message: string; enabled: boolean };
export type OscSubscription = { [key in TimerLifeCycleKey]: OscSubscriptionOptions[] };

export interface OSCSettings {
  portIn: number;
  portOut: number;
  targetIP: string;
  enabledIn: boolean;
  enabledOut: boolean;
  subscriptions: OscSubscription;
}
