import { Subscription } from './Subscription.type.js';

export type OscSubscriptionOptions = { message: string; enabled: boolean };
export type OscSubscription = Subscription<OscSubscriptionOptions>;

export interface OSCSettings {
  portIn: number;
  portOut: number;
  targetIP: string;
  enabledIn: boolean;
  enabledOut: boolean;
  subscriptions: OscSubscription;
}
