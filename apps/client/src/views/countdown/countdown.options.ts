import { CustomFields, EntryId, OntimeEvent } from 'ontime-types';
import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { getTimeOption, TimeOptions } from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import {
  makeOptionsFromCustomFields,
  makeViewParamsReader,
} from '../../common/components/view-params-editor/viewParams.utils';
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean } from '../common/viewUtils';

export const getCountdownOptions = (
  timeFormat: string,
  customFields: CustomFields,
  persistedSubscriptions: EntryId[],
): ViewOption[] => {
  const mainOptions = makeOptionsFromCustomFields(customFields, [{ value: 'title', label: 'Title' }]);
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
          type: 'option',
          values: mainOptions,
          defaultValue: 'title',
        },
        {
          id: 'secondary-src',
          title: 'Secondary text',
          description: 'Shown in the event card',
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
          title: 'Show expected times',
          description: 'Times account for the runtime offset',
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
          title: 'Hide past events',
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
          description: 'The events and groups to follow',
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
} & TimeOptions;

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams, defaultValues?: URLSearchParams): CountdownOptions {
  const params = makeViewParamsReader(searchParams, defaultValues);

  return {
    subscriptions: params.getAll('sub') as EntryId[],
    mainSource: params.get('main') as keyof OntimeEvent | null,
    secondarySource: params.get('secondary-src') as keyof OntimeEvent | null,
    showExpected: isStringBoolean(params.get('showExpected')),
    hidePast: isStringBoolean(params.get('hidePast')),
    timeformat: params.get('timeformat'),
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
