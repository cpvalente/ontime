import { TimerLifeCycleKey } from './TimerLifecycle.type.js';

export type SubscriptionOptions = { message: string; enabled: boolean };
export type Subscription = { [key in TimerLifeCycleKey]: SubscriptionOptions[] };