import type { AutomationOutput, HTTPOutput, OSCOutput } from '../definitions/core/Automation.type.js';
import type { OntimeBlock, OntimeDelay, OntimeEvent, PlayableEvent } from '../definitions/core/OntimeEvent.type.js';
import { SupportedEvent } from '../definitions/core/OntimeEvent.type.js';
import type { OntimeRundownEntry } from '../definitions/core/Rundown.type.js';
import type { TimerLifeCycleKey } from '../definitions/core/TimerLifecycle.type.js';
import { TimerLifeCycle } from '../definitions/core/TimerLifecycle.type.js';

type MaybeEvent = OntimeRundownEntry | Partial<OntimeRundownEntry> | null | undefined;

export function isOntimeEvent(event: MaybeEvent): event is OntimeEvent {
  return event?.type === SupportedEvent.Event;
}

export function isPlayableEvent(event: OntimeEvent): event is PlayableEvent {
  return !event.skip;
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

export function isOSCOutput(output: AutomationOutput): output is OSCOutput {
  return output.type === 'osc';
}

export function isHTTPOutput(output: AutomationOutput): output is HTTPOutput {
  return output.type === 'http';
}
