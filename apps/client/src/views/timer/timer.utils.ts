import {
  GroupTimerState,
  MaybeNumber,
  MessageState,
  OntimeEvent,
  Playback,
  RundownEntries,
  TimerMessage,
  TimerPhase,
  TimerState,
  TimerType,
} from 'ontime-types';
import { isPlaybackActive } from 'ontime-utils';

import { getFormattedTimer, getPropertyValue } from '../common/viewUtils';

/**
 * Whether a message should be shown
 */
export function getShowMessage(message: TimerMessage): boolean {
  return message.text !== '' && message.visible;
}

/**
 * Whether the playback is playing
 */
export function getIsPlaying(playback: Playback): boolean {
  return playback === Playback.Play || playback === Playback.Roll;
}

/**
 * Gets the total time from the duration and added time of an event
 */
export function getTotalTime(duration: MaybeNumber, addedTime: MaybeNumber): number {
  return (duration ?? 0) + (addedTime ?? 0);
}

/**
 * Whether this timer type renders a value derived from the running timer.
 * Clock shows the time of day and none shows nothing, so neither reflects what is loaded,
 * which also means neither can carry a progress bar or a group timer indicator
 */
export function getShowsTimerValue(timerType: TimerType) {
  return timerType !== TimerType.None && timerType !== TimerType.Clock;
}

/**
 * Whether the clock should be shown with this timer type
 */
export function getShowClock(timerType: TimerType) {
  return timerType !== TimerType.Clock;
}

const fontSizeMap: { [key: number]: number } = {
  4: 28, // 9:01
  5: 28, // -9:01, 10:01, 9 min
  6: 25, // -10:01, 10 min
  8: 18, // 23:01:01
  9: 18, // -23:01:01
};

/**
 * Finds a font size that fits the timer in the screen
 * Unfortunately hand tweaked
 */
export function getEstimatedFontSize(stageTimer: string, secondaryContent?: string): number {
  const stageTimerCharacters = stageTimer.length;
  let timerFontSize = (100 / (stageTimerCharacters - 1)) * 1.25;

  if (fontSizeMap[stageTimerCharacters]) {
    timerFontSize = fontSizeMap[stageTimerCharacters];
  }

  // we need to shrink the timer if the external is going to be there
  // this number has been tweaked to fit in a landscape mobile screen
  if (secondaryContent) {
    timerFontSize *= 0.6;
  }

  return timerFontSize;
}

/**
 * which, if any, modifier should be shown at any time
 */
export function getShowModifiers(
  timerType: TimerType,
  countToEnd: boolean,
  phase: TimerPhase,
  freezeOvertime: boolean,
  freezeMessage: string,
  hidePhase: boolean,
) {
  if (hidePhase) {
    return {
      showEndMessage: false,
      showFinished: false,
      showWarning: false,
      showDanger: false,
    };
  }

  const showModifiers = timerType === TimerType.CountDown || countToEnd;
  if (!showModifiers) {
    return {
      showEndMessage: false,
      showFinished: false,
      showWarning: false,
      showDanger: false,
    };
  }

  return {
    showEndMessage: phase === TimerPhase.Overtime && freezeOvertime && freezeMessage !== '',
    showFinished: phase === TimerPhase.Overtime,
    showWarning: phase === TimerPhase.Warning,
    showDanger: phase === TimerPhase.Danger,
  };
}

interface ResolveTimerDisplayOptions {
  time: TimerState;
  /** when present, views show the group instead of the running event */
  groupTimer: GroupTimerState | null;
  event: Pick<OntimeEvent, 'timeWarning' | 'timeDanger'> | null;
  timerType: TimerType;
  countToEnd: boolean;
  freezeOvertime: boolean;
  freezeMessage: string;
  hidePhase: boolean;
}

/**
 * Resolves which timer a view should display, and the modifiers that go with it.
 *
 * A group has no warning or danger thresholds of its own, so it only ever reports as
 * running or overtime. Feeding that phase through `getShowModifiers` means the warning
 * and danger states are suppressed as a consequence of what a group is, rather than
 * every view having to remember to special case them.
 */
export function resolveTimerDisplay({
  time,
  groupTimer,
  event,
  timerType,
  countToEnd,
  freezeOvertime,
  freezeMessage,
  hidePhase,
}: ResolveTimerDisplayOptions) {
  const isGroup = groupTimer !== null;
  const phase = (() => {
    if (!isGroup) return time.phase;
    // pending and none describe the playback state rather than a threshold,
    // they are just as true of the group as they are of the event
    if (time.phase === TimerPhase.Pending || time.phase === TimerPhase.None) return time.phase;
    return groupTimer.current <= 0 ? TimerPhase.Overtime : TimerPhase.Default;
  })();

  return {
    isGroup,
    phase,
    /** the values to render, shaped for getTimerByType */
    source: isGroup ? groupTimer : time,
    /** the target of a progress bar */
    total: isGroup ? groupTimer.duration : getTotalTime(time.duration, time.addedTime),
    // thresholds belong to the event, they carry no meaning against a group duration
    warning: isGroup ? undefined : event?.timeWarning,
    danger: isGroup ? undefined : event?.timeDanger,
    ...getShowModifiers(timerType, countToEnd, phase, freezeOvertime, freezeMessage, hidePhase),
  };
}

/**
 * What, if anything, should be displayed in the secondary field
 */
export function getSecondaryDisplay(
  message: MessageState,
  currentAux: MaybeNumber,
  localisedMinutes: string,
  removeSeconds: boolean,
  removeLeadingZero: boolean,
  hideSecondary: boolean,
): string | undefined {
  if (hideSecondary) {
    return;
  }
  if (
    message.timer.secondarySource === 'aux1' ||
    message.timer.secondarySource === 'aux2' ||
    message.timer.secondarySource === 'aux3'
  ) {
    return getFormattedTimer(currentAux, TimerType.CountDown, localisedMinutes, {
      removeSeconds,
      removeLeadingZero,
    });
  }
  if (message.timer.secondarySource === 'secondary' && message.secondary) {
    return message.secondary;
  }
  return;
}

/**
 * What should we be showing in the cards?
 */
export function getCardData(
  eventNow: OntimeEvent | null,
  eventNext: OntimeEvent | null,
  mainSource: keyof OntimeEvent | null | 'none',
  secondarySource: keyof OntimeEvent | null | 'none',
  playback: Playback,
  phase: TimerPhase,
  entries: RundownEntries,
) {
  if (playback === Playback.Stop) {
    return {
      showNow: false,
      nowMain: undefined,
      nowSecondary: undefined,
      showNext: false,
      nextMain: undefined,
      nextSecondary: undefined,
    };
  }

  // pending roll timers would be classified as active
  const hasActiveTimer = isPlaybackActive(playback) && phase !== TimerPhase.Pending;

  // if we are loaded, we show the upcoming event as next
  const nowMain = hasActiveTimer ? getPropertyValue(eventNow, mainSource ?? 'title') : undefined;
  const nowSecondary = hasActiveTimer ? getPropertyValue(eventNow, secondarySource, entries) : undefined;
  const nextMain = hasActiveTimer
    ? getPropertyValue(eventNext, mainSource ?? 'title')
    : getPropertyValue(eventNow, mainSource ?? 'title');
  const nextSecondary = hasActiveTimer
    ? getPropertyValue(eventNext, secondarySource, entries)
    : getPropertyValue(eventNow, secondarySource, entries);

  return {
    showNow: mainSource !== 'none' && (Boolean(nowMain) || Boolean(nowSecondary)),
    nowMain,
    nowSecondary,
    showNext: mainSource !== 'none' && (Boolean(nextMain) || Boolean(nextSecondary)),
    nextMain,
    nextSecondary,
  };
}
