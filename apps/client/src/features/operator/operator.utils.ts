import { CustomFields, EntryId, MaybeString, OntimeEvent } from 'ontime-types';

import { getPropertyValue } from '../viewers/common/viewUtils';

import type { Subscribed } from './operator.types';

type OperatorMetadata = {
  isLinkedToLoaded: boolean;
  isPast: boolean;
  isSelected: boolean;
  totalGap: number;
};

export function makeOperatorMetadata(selectedId: EntryId | null) {
  const hasSelection = Boolean(selectedId);
  let hasSeenSelected = false;
  let totalGap = 0;
  /** if the event can link all the way back to the currently playing event */
  let isLinkedToLoaded = false;
  let previousEvent: OntimeEvent | null = null;

  function process(event: OntimeEvent): Readonly<OperatorMetadata> {
    const isSelected = event.id === selectedId;
    if (isSelected) {
      hasSeenSelected = true;
    }

    // is past if we havent yet seen the selected event
    const isPast = hasSelection && !hasSeenSelected;
    totalGap += event.gap;

    if (!isPast && !isSelected) {
      /**
       * isLinkToLoaded is a chain value that we maintain until we
       * a) find an unlinked event
       * b) find a countToEnd event
       */
      isLinkedToLoaded = event.linkStart && !previousEvent?.countToEnd;
    }

    previousEvent = event;
    return { isPast, isSelected, totalGap, isLinkedToLoaded };
  }

  return { process };
}

export function getEventData(
  event: OntimeEvent,
  main: MaybeString,
  secondary: MaybeString,
  subscriptions: string[],
  customFields: CustomFields,
) {
  const mainField = main ? getPropertyValue(event, main) ?? '' : event.title;
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
