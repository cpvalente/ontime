import { TimerLifeCycle } from './TimerLifecycle.type';

export type TimerLifeCycleKey = keyof typeof TimerLifeCycle;
export type OscSubscription = { [key in TimerLifeCycleKey]?: { message: string; enabled: boolean } };

export interface OSCSettings {
  portIn: number;
  portOut: number;
  targetIP: string;
  enabledIn: boolean;
  enabledOut: boolean;
  subscriptions: OscSubscription;
}
