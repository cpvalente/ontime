import { TimerLifeCycleKey } from './TimerLifecycle.type.js';

export type Subscription<T> = { [key in TimerLifeCycleKey]: T[] };
