import { CustomFields, OntimeEvent } from 'ontime-types';
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

export const getTimelineOptions = (timeFormat: string, customFields: CustomFields): ViewOption[] => {
  const mainOptions = makeOptionsFromCustomFields(customFields, [{ value: 'title', label: 'Title' }]);

  const secondaryOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'none', label: 'None' },
    { value: 'title', label: 'Title' },
    { value: 'note', label: 'Note' },
    { value: 'parent', label: 'Group title' },
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
          type: 'option',
          values: secondaryOptions,
          defaultValue: 'none',
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
        {
          id: 'fixedSize',
          title: 'Fixed timeline size',
          description: 'Fits the timeline to the screen width to prevent scrolling',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
  ];
};

type TimelineOptions = {
  mainSource: keyof OntimeEvent | null;
  secondarySource: keyof OntimeEvent | null | 'none';
  hidePast: boolean;
  fixedSize: boolean;
} & TimeOptions;

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with getTimelineOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams, defaultValues?: URLSearchParams): TimelineOptions {
  const params = makeViewParamsReader(searchParams, defaultValues);

  return {
    mainSource: params.get('main') as keyof OntimeEvent | null,
    secondarySource: params.get('secondary-src') as keyof OntimeEvent | null,
    hidePast: isStringBoolean(params.get('hidePast')),
    fixedSize: isStringBoolean(params.get('fixedSize')),
    timeformat: params.get('timeformat'),
  };
}

/**
 * Hook exposes the timeline view options
 */
export function useTimelineOptions(): TimelineOptions {
  const [searchParams] = useSearchParams();
  const maybePreset = use(PresetContext);

  const options = useMemo(() => {
    const defaultValues = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
    return getOptionsFromParams(searchParams, defaultValues);
  }, [maybePreset, searchParams]);

  return options;
}
