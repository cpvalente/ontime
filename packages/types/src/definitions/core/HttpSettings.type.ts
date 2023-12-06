import { Subscription } from './Subscription.type.js';

export type HttpSubscriptionOptions = { message: string; enabled: boolean };
export type HttpSubscription = Subscription<HttpSubscriptionOptions>;

export interface HttpSettings {
  enabledOut: boolean;
  retryCount: number;
  subscriptions: HttpSubscription;
}
