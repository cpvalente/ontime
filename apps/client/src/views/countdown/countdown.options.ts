import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { CustomFields, EntryId, OntimeEvent } from 'ontime-types';

import { getTimeOption } from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { makeOptionsFromCustomFields } from '../../common/components/view-params-editor/viewParams.utils';
import { getCurrentPath, makePresetKey } from '../../common/utils/urlPresets';
import { isStringBoolean } from '../../features/viewers/common/viewUtils';

export const getCountdownOptions = (
  timeFormat: string,
  customFields: CustomFields,
  persistedSubscriptions: EntryId[],
): ViewOption[] => {
  const secondaryOptions = makeOptionsFromCustomFields(customFields, [{ value: 'note', label: 'Note' }]);

  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'secondary-src',
          title: 'Event secondary text',
          description: 'Select the data source for auxiliary text shown in the card',
          type: 'option',
          values: secondaryOptions,
          defaultValue: '',
        },
      ],
    },
    {
      title: OptionTitle.BehaviourOptions,
      collapsible: true,
      options: [
        {
          id: 'showProjected',
          title: 'Show projected time',
          description: 'Whether scheduled times should account for runtime offset',
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
  secondarySource: keyof OntimeEvent | null;
  showProjected: boolean;
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
    subscriptions: getArrayValues('subscriptions'),
    secondarySource: getValue('secondary-src') as keyof OntimeEvent | null,
    showProjected: isStringBoolean(getValue('showProjected')),
  };
}

/**
 * Hook exposes the countdown view options
 */
export function useCountdownOptions(): CountdownOptions {
  const [searchParams] = useSearchParams();

  const options = useMemo(() => {
    const pathName = getCurrentPath(window.location);
    const presetSearch = window.sessionStorage.getItem(makePresetKey(pathName));
    const defaultValues = presetSearch ? new URLSearchParams(presetSearch) : undefined;
    return getOptionsFromParams(searchParams, defaultValues);
  }, [searchParams]);

  return options;
}
