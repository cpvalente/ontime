import { OntimeRundownEntry } from '../definitions/core/Rundown.type.js';
import { OntimeBlock, OntimeDelay, OntimeEvent, SupportedEvent } from '../definitions/core/OntimeEvent.type.js';
import { TimerLifeCycle, TimerLifeCycleKey } from '../definitions/core/TimerLifecycle.type.js';

type MaybeEvent = OntimeRundownEntry | Partial<OntimeRundownEntry> | null | undefined;

export function isOntimeEvent(event: MaybeEvent): event is OntimeEvent {
  return event?.type === SupportedEvent.Event;
}

export function isOntimeDelay(event: MaybeEvent): event is OntimeDelay {
  return event?.type === SupportedEvent.Delay;
}

export function isOntimeBlock(event: MaybeEvent): event is OntimeBlock {
  return event?.type === SupportedEvent.Block;
}

type AnyKeys<T> = keyof T;

export function isKeyOfType<T extends object>(key: PropertyKey, obj: T): key is AnyKeys<T> {
  return key in obj;
}

export function isOntimeCycle(maybeCycle: unknown): maybeCycle is TimerLifeCycleKey {
  if (typeof maybeCycle !== 'string') return false;
  return Object.values(TimerLifeCycle).includes(maybeCycle as TimerLifeCycle);
}
