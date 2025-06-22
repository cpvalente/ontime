import type { CustomFields } from 'ontime-types';

import type { MultiselectOptions, ViewOption } from './viewParams.types';

/**
 * Creates a list of custom fields for a select
 * Filters out image type custom fields
 */
export function makeOptionsFromCustomFields(
  customFields: CustomFields,
  additionalOptions: Readonly<Record<string, string>> = {},
  filterImageType = true,
): Record<string, string> {
  const options = { ...additionalOptions };
  for (const [key, value] of Object.entries(customFields)) {
    if (filterImageType && value.type === 'image') {
      continue;
    }

    options[`custom-${key}`] = `Custom: ${value.label}`;
  }
  return options;
}

/**
 * Creates data for a multiselect component from custom fields
 * Filters out image type custom fields
 */
export function makeCustomFieldSelectOptions(customFields: CustomFields, filterImageType = true): MultiselectOptions {
  const options: MultiselectOptions = {};
  for (const [key, value] of Object.entries(customFields)) {
    if (filterImageType && value.type === 'image') {
      continue;
    }
    options[key] = { value: key, label: value.label, colour: value.colour };
  }
  return options;
}

type ViewParamsObj = { [key: string]: string | FormDataEntryValue };

/**
 * Utility remove the # character from a hex string
 */
function sanitiseColour(colour: string) {
  if (colour.startsWith('#')) {
    return colour.substring(1);
  }
  return colour;
}

type FieldMetadata = {
  defaultValues: Record<string, string>;
  colorFields: Set<string>;
  isPersistedField: Set<string>;
  persistedValues: Record<string, string[]>;
};

/**
 * Utility collects metadata about fields from view options
 */
function collectFieldMetadata(paramFields: ViewOption[]): FieldMetadata {
  const metadata: FieldMetadata = {
    defaultValues: {},
    colorFields: new Set(),
    isPersistedField: new Set(),
    persistedValues: {},
  };

  paramFields.forEach((section) => {
    section.options.forEach((option) => {
      if (option.type === 'persist') {
        metadata.isPersistedField.add(option.id);
        if (option.values) {
          metadata.persistedValues[option.id] = option.values;
        }
      } else {
        metadata.defaultValues[option.id] = String(option.defaultValue);
      }

      if (option.type === 'colour') {
        metadata.colorFields.add(option.id);
      }
    });
  });

  return metadata;
}

/**
 * Makes a new URLSearchParams object from the given params object
 * @param paramsObj - The object containing parameters to be converted
 * @param paramFields - The view options that define the parameters
 * @returns A new URLSearchParams object with the parameters
 */
export function getURLSearchParamsFromObj(paramsObj: ViewParamsObj, paramFields: ViewOption[]) {
  const newSearchParams = new URLSearchParams();
  const addedPairs = new Set<string>();
  const metadata = collectFieldMetadata(paramFields);

  // Utility function to safely add params without duplicates
  const addUniqueParam = (id: string, value: string) => {
    const pair = `${id}:${value}`;
    if (!addedPairs.has(pair)) {
      addedPairs.add(pair);
      newSearchParams.append(id, value);
    }
  };

  // First add all persisted values
  Object.entries(metadata.persistedValues).forEach(([id, values]) => {
    values.forEach((value) => {
      if (value) {
        addUniqueParam(id, value);
      }
    });
  });

  // Then process user-provided values
  Object.entries(paramsObj).forEach(([id, value]) => {
    if (typeof value === 'string' && value.length) {
      // For persisted fields, clear existing values before adding new ones
      if (metadata.isPersistedField.has(id)) {
        // Clear tracking of previous values for this field
        Array.from(addedPairs).forEach((pair) => {
          if (pair.startsWith(`${id}:`)) {
            addedPairs.delete(pair);
          }
        });
        newSearchParams.delete(id);
      }

      // Process and add new values
      value.split(',').forEach((v) => {
        const processedValue = metadata.colorFields.has(id) ? sanitiseColour(v) : v;
        if (metadata.isPersistedField.has(id) || metadata.defaultValues[id] !== processedValue) {
          addUniqueParam(id, processedValue);
        }
      });
    }
  });

  return newSearchParams;
}
