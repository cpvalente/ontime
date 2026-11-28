import type { CustomFields, ProjectData } from 'ontime-types';

import type { SelectOption } from '../select/Select';
import type { MultiselectOption, ViewOption } from './viewParams.types';

/**
 * Creates a list of custom fields for a select
 * Filters out image type custom fields
 */
export function makeOptionsFromCustomFields(
  customFields: CustomFields,
  additionalOptions: SelectOption[] = [],
  filterImageType = true,
): SelectOption[] {
  const options: SelectOption[] = [...additionalOptions];

  // Add custom fields first
  for (const field of customFields) {
    if (filterImageType && field.type === 'image') {
      continue;
    }

    options.push({
      value: `custom-${field.key}`,
      label: `Custom: ${field.label}`,
    });
  }

  return options;
}

/**
 * Creates data for a multiselect component from custom fields
 * Filters out image type custom fields
 */
export function makeCustomFieldSelectOptions(customFields: CustomFields, filterImageType = true): MultiselectOption[] {
  const options: MultiselectOption[] = [];

  // Add custom fields first
  for (const field of customFields) {
    if (filterImageType && field.type === 'image') {
      continue;
    }

    options.push({
      value: field.key,
      label: field.label,
      colour: field.colour,
    });
  }

  return options;
}

/**
 * Creates data for a select element that displays project custom data
 */
export function makeProjectDataOptions(
  projectData: ProjectData,
  additionalOptions: SelectOption[] = [],
): SelectOption[] {
  const generatedOptions = projectData.custom.map((entry, index) => {
    return {
      value: `${index}-${entry.title}`,
      label: entry.title,
    };
  });

  return [...additionalOptions, ...generatedOptions];
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
  defaultValues: Record<string, string[]>;
  colorFields: Set<string>;
  booleanFields: Set<string>;
  isPersistedField: Set<string>;
  persistedValues: Record<string, string[]>;
};

/**
 * Utility collects metadata about fields from view options
 * - where are the default values
 * - which fields are colours
 * - which fields are persisted
 */
function collectFieldMetadata(paramFields: ViewOption[]): FieldMetadata {
  const metadata: FieldMetadata = {
    defaultValues: {},
    colorFields: new Set(),
    booleanFields: new Set(),
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
      } else if (option.type === 'multi-option') {
        if (option.defaultValue) {
          metadata.defaultValues[option.id] = option.defaultValue;
        }
      } else if (option.defaultValue !== undefined) {
        metadata.defaultValues[option.id] = [String(option.defaultValue)];
      }

      if (option.type === 'colour') {
        metadata.colorFields.add(option.id);
      } else if (option.type === 'boolean') {
        metadata.booleanFields.add(option.id);
      }
    });
  });

  return metadata;
}

/**
 * Whether two lists hold the same values, regardless of order or repetition
 */
function isSameValueSet(values: string[], other: string[] | undefined): boolean {
  if (!other) {
    return false;
  }
  const valueSet = new Set(values);
  const otherSet = new Set(other);
  return valueSet.size === otherSet.size && [...valueSet].every((value) => otherSet.has(value));
}

/**
 * Makes a new URLSearchParams object from the given params object
 * Values equal to the field default are omitted, so share links only carry customisation
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
    if (typeof value !== 'string' || !value.length) {
      return;
    }

    if (metadata.isPersistedField.has(id)) {
      // For persisted fields, clear existing values before adding new ones
      Array.from(addedPairs).forEach((pair) => {
        if (pair.startsWith(`${id}:`)) {
          addedPairs.delete(pair);
        }
      });
      newSearchParams.delete(id);
    }

    // some field types need extra processing
    const processedValues = value.split(',').map((v) => {
      if (metadata.colorFields.has(id)) {
        return sanitiseColour(v);
      }
      if (metadata.booleanFields.has(id)) {
        return v === 'on' ? 'true' : 'false';
      }
      return v;
    });

    if (!metadata.isPersistedField.has(id) && isSameValueSet(processedValues, metadata.defaultValues[id])) {
      return;
    }

    processedValues.forEach((v) => addUniqueParam(id, v));
  });

  return newSearchParams;
}

/**
 * Extracts search params that are not managed by the view params editor
 * @param currentParams - The current URL search params
 * @param paramFields - The view options that define the managed parameters
 * @returns A new URLSearchParams object with preserved params
 */
export function getPreservedSearchParams(currentParams: URLSearchParams, paramFields: ViewOption[]) {
  const managedParamIds = new Set<string>();
  paramFields.forEach((section) => {
    section.options.forEach((option) => {
      managedParamIds.add(option.id);
    });
  });

  const preserved = new URLSearchParams();
  currentParams.forEach((value, key) => {
    if (!managedParamIds.has(key)) {
      preserved.append(key, value);
    }
  });
  // edited params no longer match the preset, so the alias marking it as current is dropped
  preserved.delete('alias');
  return preserved;
}

/**
 * Reads view params, giving the values of a preset priority over the URL
 * @param searchParams - The current URL search params
 * @param presetParams - The search params of the preset the view is loaded from, if any
 */
export function makeViewParamsReader(searchParams: URLSearchParams, presetParams?: URLSearchParams) {
  return {
    get: (key: string): string | null => presetParams?.get(key) ?? searchParams.get(key),
    getAll: (key: string): string[] => (presetParams?.has(key) ? presetParams : searchParams).getAll(key),
  };
}
