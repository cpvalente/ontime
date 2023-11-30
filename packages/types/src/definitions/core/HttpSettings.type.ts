import { Subscription } from './Subscription.type.js';

type HttpSubscriptionOptions = { message: string; enabled: boolean };
export type HttpSubscription = Subscription<HttpSubscriptionOptions>;

export interface HTTPSettings {
  enabledOut: boolean;
  subscriptions: HttpSubscription;
}
