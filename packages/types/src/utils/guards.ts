import type { AutomationOutput, HTTPOutput, OntimeAction, OSCOutput } from '../definitions/core/Automation.type.js';
import type { OntimeBlock, OntimeDelay, OntimeEvent, PlayableEvent } from '../definitions/core/OntimeEvent.type.js';
import { SupportedEvent } from '../definitions/core/OntimeEvent.type.js';
import type { OntimeEntry } from '../definitions/core/Rundown.type.js';
import { type TimerLifeCycle, timerLifecycleValues } from '../definitions/core/TimerLifecycle.type.js';

type MaybeEvent = OntimeEntry | Partial<OntimeEntry> | null | undefined;

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

export function isOSCOutput(output: AutomationOutput): output is OSCOutput {
  return output.type === 'osc';
}

export function isHTTPOutput(output: AutomationOutput): output is HTTPOutput {
  return output.type === 'http';
}

export function isOntimeAction(output: AutomationOutput): output is OntimeAction {
  return output.type === 'ontime';
}

export function isTimerLifeCycle(maybeCycle: unknown): maybeCycle is TimerLifeCycle {
  if (typeof maybeCycle !== 'string') return false;
  return timerLifecycleValues.includes(maybeCycle);
}
