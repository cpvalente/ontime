import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { getTimeOption } from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean } from '../../features/viewers/common/viewUtils';

export const getTimelineOptions = (timeFormat: string): ViewOption[] => {
  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
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
          id: 'autosize',
          title: 'Autosize timeline',
          description: 'Timeline will adjust sizes to help with readability and automatically scroll if necessary',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
  ];
};

type TimelineOptions = {
  hidePast: boolean;
  autosize: boolean;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams, defaultValues?: URLSearchParams): TimelineOptions {
  // Helper to get value from either source, prioritizing defaultValues
  const getValue = (key: string) => defaultValues?.get(key) ?? searchParams.get(key);

  return {
    hidePast: isStringBoolean(getValue('hidePast')),
    autosize: isStringBoolean(getValue('autosize')),
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
