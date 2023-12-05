import { Subscription } from './Subscription.type.js';

type httpMethod = 'GET' | 'POST';
export type HttpSubscriptionOptions = { url: string; options: string; enabled: boolean; method: httpMethod };
export type HttpSubscription = Subscription<HttpSubscriptionOptions>;

export interface HttpSettings {
  enabledOut: boolean;
  retryCount: number;
  subscriptions: HttpSubscription;
}
