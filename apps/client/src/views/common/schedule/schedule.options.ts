import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { SelectOption } from '../../../common/components/select/Select';
import { OptionTitle } from '../../../common/components/view-params-editor/constants';
import type { ViewOption } from '../../../common/components/view-params-editor/viewParams.types';
import { PresetContext } from '../../../common/context/PresetContext';
import { isStringBoolean } from '../viewUtils';

export const getScheduleOptions = (customFieldOptions: SelectOption[]): ViewOption => ({
  title: OptionTitle.Schedule,
  collapsible: true,
  options: [
    {
      id: 'filter',
      title: 'Filter',
      description: 'Hide events without data in the selected custom field',
      type: 'option',
      values: customFieldOptions,
      defaultValue: 'none',
    },
    {
      id: 'stopCycle',
      title: 'Stop cycling through event pages',
      description: 'Schedule will not auto-cycle through events',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'cycleInterval',
      title: 'Cycle interval',
      description: 'How long (in seconds) should each schedule page be shown.',
      type: 'number',
      defaultValue: 10,
    },
    {
      id: 'showExpected',
      title: 'Show expected time',
      description: 'Whether the times shown should account for the runtime offset.',
      type: 'boolean',
      defaultValue: false,
    },
  ],
});

type ScheduleOptions = {
  filter: string | null;
  cycleInterval: number;
  stopCycle: boolean;
  showExpected: boolean;
};

export function getScheduleOptionsFromParams(
  searchParams: URLSearchParams,
  defaultValues?: URLSearchParams,
): ScheduleOptions {
  // Helper to get value from either source, prioritizing defaultValues
  const getValue = (key: string) => defaultValues?.get(key) ?? searchParams.get(key);

  return {
    filter: getValue('filter'),
    cycleInterval: Number(getValue('cycleInterval')) || 10,
    stopCycle: isStringBoolean(getValue('stopCycle')),
    showExpected: isStringBoolean(getValue('showExpected')),
  };
}

/**
 * Hook exposes the schedule component options
 */
export function useScheduleOptions() {
  const [searchParams] = useSearchParams();
  const maybePreset = use(PresetContext);

  const options = useMemo(() => {
    const defaultValues = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
    return getScheduleOptionsFromParams(searchParams, defaultValues);
  }, [maybePreset, searchParams]);

  return options;
}
