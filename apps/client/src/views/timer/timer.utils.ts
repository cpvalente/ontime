import { MaybeNumber, MessageState, OntimeEvent, Playback, TimerMessage, TimerPhase, TimerType } from 'ontime-types';
import { isPlaybackActive } from 'ontime-utils';

import { getFormattedTimer, getPropertyValue } from '../../features/viewers/common/viewUtils';

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
 * Whether the progress bar should be shown for this timer type
 */
export function getShowProgressBar(timerType: TimerType) {
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
  8: 20, // 23:01:01
  9: 20, // -23:01:01
};

/**
 * Finds a font size that fits the timer in the screen
 * Unfortunately hand tweaked
 */
export function getEstimatedFontSize(stageTimer: string, secondaryContent?: string) {
  const stageTimerCharacters = stageTimer.length;
  let timerFontSize = (100 / (stageTimerCharacters - 1)) * 1.25;

  if (fontSizeMap[stageTimerCharacters]) {
    timerFontSize = fontSizeMap[stageTimerCharacters];
  }

  let externalFontSize = timerFontSize * 0.2;
  if (secondaryContent) {
    // we need to shrink the timer if the external is going to be there
    // this number has been tweaked to fit in a landscape mobile screen
    timerFontSize *= 0.6;
    if (secondaryContent.length > 25) {
      externalFontSize = (100 / (secondaryContent.length - 1)) * 1.8;
    }
  }

  return {
    timerFontSize,
    externalFontSize,
  };
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
    showEndMessage: freezeOvertime && freezeMessage !== '',
    showFinished: phase === TimerPhase.Overtime,
    showWarning: phase === TimerPhase.Warning,
    showDanger: phase === TimerPhase.Danger,
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
  mainSource: keyof OntimeEvent | null,
  secondarySource: keyof OntimeEvent | null,
  playback: Playback,
  phase: TimerPhase,
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
  const nowSecondary = hasActiveTimer ? getPropertyValue(eventNow, secondarySource) : undefined;
  const nextMain = hasActiveTimer
    ? getPropertyValue(eventNext, mainSource ?? 'title')
    : getPropertyValue(eventNow, mainSource ?? 'title');
  const nextSecondary = hasActiveTimer
    ? getPropertyValue(eventNext, secondarySource)
    : getPropertyValue(eventNow, secondarySource);

  return {
    showNow: Boolean(nowMain) || Boolean(nowSecondary),
    nowMain,
    nowSecondary,
    showNext: Boolean(nextMain) || Boolean(nextSecondary),
    nextMain,
    nextSecondary,
  };
}
