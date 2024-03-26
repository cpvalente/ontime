import { TimerLifeCycleKey } from './TimerLifecycle.type.js';

export type OscSubscription = {
  id: string;
  cycle: TimerLifeCycleKey;
  address: string;
  payload: string;
  enabled: boolean;
};

export interface OSCSettings {
  portIn: number;
  portOut: number;
  targetIP: string;
  enabledIn: boolean;
  enabledOut: boolean;
  subscriptions: OscSubscription[];
}
