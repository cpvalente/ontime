import type { MaybeString } from 'ontime-types';
import { EndAction, TimerType, TimeStrategy } from 'ontime-types';

/**
 * Check if a given value is a valid type linkStart, returns the fallback otherwise
 * linkStart can be a string (id of an event to link) or null (unlinked)
 * @param {MaybeString} maybeLinkStart
 * @returns {MaybeString}
 */
export function validateLinkStart(maybeLinkStart: unknown, fallback: MaybeString = null): MaybeString {
  if (typeof maybeLinkStart === 'string' || maybeLinkStart === null) {
    return maybeLinkStart as MaybeString;
  }
  return fallback;
}

/**
 * Check if a given value is a valid time strategy, returns the fallback otherwise
 * @param {TimeStrategy} maybeTimeStrategy
 * @returns {TimeStrategy}
 */
export function validateTimeStrategy(maybeTimeStrategy: unknown, fallback = TimeStrategy.LockDuration): TimeStrategy {
  return Object.values(TimeStrategy).includes(maybeTimeStrategy as TimeStrategy)
    ? (maybeTimeStrategy as TimeStrategy)
    : fallback;
}

/**
 * Checks if given value is a valid type of EndAction, returns the fallback otherwise
 * @param {EndAction} maybeAction
 * @param {EndAction} [fallback]
 */
export function validateEndAction(maybeAction: unknown, fallback = EndAction.None): EndAction {
  return Object.values(EndAction).includes(maybeAction as EndAction) ? (maybeAction as EndAction) : fallback;
}

/**
 * Checks if given value is a valid type of TimerType, returns the fallback otherwise
 * @param {TimerType} maybeTimerType
 * @param {TimerType} [fallback]
 */
export function validateTimerType(maybeTimerType: unknown, fallback = TimerType.CountDown): TimerType {
  return Object.values(TimerType).includes(maybeTimerType as TimerType) ? (maybeTimerType as TimerType) : fallback;
}

export function isKnownTimerType(maybeTimerType: unknown) {
  return Object.values(TimerType).includes(maybeTimerType as TimerType);
}
