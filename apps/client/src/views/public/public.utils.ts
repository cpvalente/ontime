import { OntimeEvent, Playback } from 'ontime-types';

import { enDash } from '../../common/utils/styleUtils';
import { getPropertyValue } from '../../features/viewers/common/viewUtils';

/**
 * What should we be showing in the cards?
 */
export function getCardData(
  eventNow: OntimeEvent | null,
  eventNext: OntimeEvent | null,
  mainSource: keyof OntimeEvent | null,
  secondarySource: keyof OntimeEvent | null,
  playback: Playback,
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

  // if we are loaded, we show the upcoming event as next
  const nowMain = getPropertyValue(eventNow, mainSource ?? 'title') || enDash;
  const nowSecondary = getPropertyValue(eventNow, secondarySource);
  const nextMain = getPropertyValue(eventNext, mainSource ?? 'title') || enDash;
  const nextSecondary = getPropertyValue(eventNext, secondarySource);

  return {
    showNow: eventNow !== null,
    nowMain,
    nowSecondary,
    showNext: eventNext !== null,
    nextMain,
    nextSecondary,
  };
}

export function getFirstStartTime(firstPublicEvent: OntimeEvent | null): number | undefined {
  return firstPublicEvent?.timeStart;
}
