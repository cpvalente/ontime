import { CustomField, CustomFieldKey, MaybeString, OntimeEvent } from 'ontime-types';

import { getPropertyValue } from '../../views/common/viewUtils';
import type { Subscribed } from './operator.types';

/**
 * Resolves the subscribed keys to their fields once, skipping fields which no longer exist
 */
export function getSubscribedFields(
  subscriptions: string[],
  fieldsByKey: ReadonlyMap<CustomFieldKey, CustomField>,
): CustomField[] {
  return subscriptions.flatMap((key) => fieldsByKey.get(key) ?? []);
}

export function getEventData(
  event: OntimeEvent,
  main: MaybeString,
  secondary: MaybeString,
  subscribedFields: CustomField[],
) {
  const mainField = main ? (getPropertyValue(event, main) ?? '') : event.title;
  const secondaryField = getPropertyValue(event, secondary) ?? '';

  const subscribedData: Subscribed = subscribedFields.map((field) => ({
    id: field.key,
    label: field.label,
    colour: field.colour,
    value: event.custom[field.key],
  }));

  return { mainField, secondaryField, subscribedData };
}
