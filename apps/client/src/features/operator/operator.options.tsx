import { CustomFields, EntryId, OntimeEvent } from 'ontime-types';
import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { getTimeOption } from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import {
  makeCustomFieldSelectOptions,
  makeOptionsFromCustomFields,
} from '../../common/components/view-params-editor/viewParams.utils';
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean } from '../../views/common/viewUtils';

export const getOperatorOptions = (customFields: CustomFields, timeFormat: string): ViewOption[] => {
  const fieldOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'none', label: 'None' },
    { value: 'title', label: 'Title' },
    { value: 'note', label: 'Note' },
  ]);
  const customFieldSelect = makeCustomFieldSelectOptions(customFields);

  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'main',
          title: 'Main data field',
          description: 'Field to be shown in the first line of text',
          type: 'option',
          values: fieldOptions,
          defaultValue: 'title',
        },
        {
          id: 'secondary-src',
          title: 'Secondary data field',
          description: 'Field to be shown in the second line of text',
          type: 'option',
          values: fieldOptions,
          defaultValue: 'none',
        },
        {
          id: 'subscribe',
          title: 'Highlight Fields',
          description: 'Choose custom fields to highlight',
          type: 'multi-option',
          values: customFieldSelect,
        },
        {
          id: 'shouldEdit',
          title: 'Edit custom field',
          description: 'Allows editing an highlighted custom field by long pressing',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
    {
      title: OptionTitle.ElementVisibility,
      collapsible: true,
      options: [
        {
          id: 'hidePast',
          title: 'Hide Past Events',
          description: 'Whether to hide events that have passed',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'showStart',
          title: 'Show planned start',
          description: 'Whether to prepend the planned start to the items',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
  ];
};

type OperatorOptions = {
  mainSource: keyof OntimeEvent | null;
  secondarySource: keyof OntimeEvent | null;
  subscribe: string[];
  shouldEdit: boolean;
  hidePast: boolean;
  showStart: boolean;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams, defaultValues?: URLSearchParams): OperatorOptions {
  // Helper to get value from either source, prioritizing defaultValues
  const getValue = (key: string) => defaultValues?.get(key) ?? searchParams.get(key);

  // Helper to get array values from either source
  const getArrayValues = (key: string): EntryId[] => {
    if (defaultValues?.has(key)) {
      return defaultValues.getAll(key) as EntryId[];
    }
    return searchParams.getAll(key) as EntryId[];
  };

  // we manually make an object that matches the key above
  return {
    mainSource: getValue('main') as keyof OntimeEvent | null,
    secondarySource: getValue('secondary-src') as keyof OntimeEvent | null,
    subscribe: getArrayValues('subscribe'),
    shouldEdit: isStringBoolean(getValue('shouldEdit')),
    hidePast: isStringBoolean(getValue('hidePast')),
    showStart: isStringBoolean(getValue('showStart')),
  };
}

/**
 * Hook exposes the operator view options
 */
export function useOperatorOptions(): OperatorOptions {
  const [searchParams] = useSearchParams();
  const maybePreset = use(PresetContext);

  const options = useMemo(() => {
    const defaultValues = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
    return getOptionsFromParams(searchParams, defaultValues);
  }, [maybePreset, searchParams]);

  return options;
}
