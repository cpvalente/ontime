import { CustomFields, MaybeString, OntimeEvent, Playback } from 'ontime-types';

import { getPropertyValue } from '../../views/common/viewUtils';
import type { Subscribed } from './operator.types';

export function getEventData(
  event: OntimeEvent,
  main: MaybeString,
  secondary: MaybeString,
  subscriptions: string[],
  customFields: CustomFields,
) {
  const mainField = main ? (getPropertyValue(event, main) ?? '') : event.title;
  const secondaryField = getPropertyValue(event, secondary) ?? '';

  // remove subscriptions that are not in customFields
  const sanitisedSubscriptions = subscriptions.filter((field) => Object.hasOwn(customFields, field));
  const subscribedData = sanitisedSubscriptions.reduce<Subscribed>((acc, id) => {
    const field = customFields[id];
    if (field) {
      acc.push({
        id,
        label: field.label,
        colour: field.colour,
        value: event.custom[id],
      });
    }
    return acc;
  }, []);

  return { mainField, secondaryField, subscribedData };
}

/**
 * Operators read the loaded event's label as tally, so it only says LIVE while the timer is running
 */
export function getLoadedEventLabel(playback: Playback): 'LIVE' | 'PAUSED' | 'ARMED' {
  switch (playback) {
    case Playback.Play:
    case Playback.Roll:
      return 'LIVE';
    case Playback.Pause:
      return 'PAUSED';
    case Playback.Armed:
    case Playback.Stop:
      return 'ARMED';
    default: {
      const exhaustive: never = playback;
      return exhaustive;
    }
  }
}
