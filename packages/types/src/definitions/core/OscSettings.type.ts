import { Subscription } from './Subscription.type.js';

export interface OSCSettings {
  portIn: number;
  portOut: number;
  targetIP: string;
  enabledIn: boolean;
  enabledOut: boolean;
  subscriptions: Subscription;
}
