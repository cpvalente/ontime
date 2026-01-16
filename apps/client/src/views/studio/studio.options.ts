import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { CustomFields, OntimeEvent } from 'ontime-types';

import { getTimeOption } from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { makeOptionsFromCustomFields } from '../../common/components/view-params-editor/viewParams.utils';
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean } from '../common/viewUtils';

export const getStudioOptions = (timeFormat: string, customFields: CustomFields): ViewOption[] => {
  const mainOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'title', label: 'Title' },
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
      ],
    },
    {
      title: OptionTitle.ElementVisibility,
      collapsible: true,
      options: [
        {
          id: 'hideCards',
          title: 'Hide cards section',
          description: 'Hides the card section with the timers',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
  ];
};

type StudioOptions = {
  mainSource: keyof OntimeEvent | null;
  hideCards: boolean;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams, defaultValues?: URLSearchParams): StudioOptions {
  // Helper to get value from either source, prioritizing defaultValues
  const getValue = (key: string) => defaultValues?.get(key) ?? searchParams.get(key);

  return {
    mainSource: getValue('main') as keyof OntimeEvent | null,
    hideCards: isStringBoolean(getValue('hideCards')),
  };
}

/**
 * Hook exposes the backstage view options
 */
export function useStudioOptions(): StudioOptions {
  const [searchParams] = useSearchParams();
  const maybePreset = use(PresetContext);

  const options = useMemo(() => {
    const defaultValues = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
    return getOptionsFromParams(searchParams, defaultValues);
  }, [maybePreset, searchParams]);

  return options;
}
