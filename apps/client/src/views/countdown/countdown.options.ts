import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { CustomFields, EntryId, OntimeEvent } from 'ontime-types';

import { getTimeOption } from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { makeOptionsFromCustomFields } from '../../common/components/view-params-editor/viewParams.utils';
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean } from '../common/viewUtils';

export const getCountdownOptions = (
  timeFormat: string,
  customFields: CustomFields,
  persistedSubscriptions: EntryId[],
): ViewOption[] => {
  const mainOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'title', label: 'Title' },
    { value: 'note', label: 'Note' },
  ]);
  const secondaryOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'none', label: 'None' },
    { value: 'note', label: 'Note' },
  ]);

  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'main',
          title: 'Main text',
          description: 'Select the data source for the main text',
          type: 'option',
          values: mainOptions,
          defaultValue: 'title',
        },
        {
          id: 'secondary-src',
          title: 'Event secondary text',
          description: 'Select the data source for auxiliary text shown in the card',
          type: 'option',
          values: secondaryOptions,
          defaultValue: 'none',
        },
      ],
    },
    {
      title: OptionTitle.BehaviourOptions,
      collapsible: true,
      options: [
        {
          id: 'showExpected',
          title: 'Show expected time',
          description: 'Whether the times shown should account for the runtime offset.',
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
      ],
    },
    {
      title: OptionTitle.Hidden,
      options: [
        {
          id: 'sub',
          title: 'Event subscription',
          description: 'The events to follow',
          values: persistedSubscriptions,
          type: 'persist',
        },
      ],
    },
  ];
};

type CountdownOptions = {
  subscriptions: EntryId[];
  mainSource: keyof OntimeEvent | null;
  secondarySource: keyof OntimeEvent | null;
  showExpected: boolean;
  hidePast: boolean;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams, defaultValues?: URLSearchParams): CountdownOptions {
  // Helper to get single value from either source, prioritizing defaultValues
  const getValue = (key: string) => defaultValues?.get(key) ?? searchParams.get(key);

  // Helper to get array values from either source
  const getArrayValues = (key: string): EntryId[] => {
    if (defaultValues?.has(key)) {
      return defaultValues.getAll(key) as EntryId[];
    }
    return searchParams.getAll(key) as EntryId[];
  };

  return {
    subscriptions: getArrayValues('sub'),
    mainSource: getValue('main') as keyof OntimeEvent | null,
    secondarySource: getValue('secondary-src') as keyof OntimeEvent | null,
    showExpected: isStringBoolean(getValue('showExpected')),
    hidePast: isStringBoolean(getValue('hidePast')),
  };
}

/**
 * Hook exposes the countdown view options
 */
export function useCountdownOptions(): CountdownOptions {
  const [searchParams] = useSearchParams();
  const maybePreset = use(PresetContext);

  const options = useMemo(() => {
    const defaultValues = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
    return getOptionsFromParams(searchParams, defaultValues);
  }, [maybePreset, searchParams]);

  return options;
}
