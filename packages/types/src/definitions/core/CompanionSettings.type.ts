import type { TimerLifeCycleKey } from './TimerLifecycle.type.js';

export type CompanionSubscription = {
  id: string;
  cycle: TimerLifeCycleKey;
  page: number;
  row: number;
  column: number;
  action: 'press' | 'down' | 'up';
  enabled: boolean;
};

export interface CompanionSettings {
  portOut: number;
  targetIP: string;
  enabledOut: boolean;
  subscriptions: CompanionSubscription[];
}
