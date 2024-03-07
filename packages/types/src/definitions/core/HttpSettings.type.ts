import { TimerLifeCycle } from './TimerLifecycle.type.js';
import { object, string, enum_, boolean, Output, array, startsWith } from 'valibot';

export const HttpSubscriptionSchema = object({
  id: string(),
  message: string([startsWith('http://')]),
  cycle: enum_(TimerLifeCycle),
  enabled: boolean(),
});

export type HttpSubscription = Output<typeof HttpSubscriptionSchema>;

export const HttpSettingsSchema = object({
  enabledOut: boolean(),
  subscriptions: array(HttpSubscriptionSchema),
});

export type HttpSettings = Output<typeof HttpSettingsSchema>;
