import { CustomFields, MaybeString, OntimeEvent } from 'ontime-types';

import { getPropertyValue } from '../viewers/common/viewUtils';

import type { Subscribed } from './operator.types';

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
