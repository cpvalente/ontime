import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { SelectOption } from '../../../common/components/select/Select';
import { OptionTitle } from '../../../common/components/view-params-editor/constants';
import type { ViewOption } from '../../../common/components/view-params-editor/viewParams.types';
import { isStringBoolean } from '../../../features/viewers/common/viewUtils';

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
      defaultValue: 'None',
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

function getScheduleOptionsFromParams(searchParams: URLSearchParams): ScheduleOptions {
  return {
    filter: searchParams.get('filter'),
    cycleInterval: Number(searchParams.get('cycleInterval')) || 10,
    stopCycle: isStringBoolean(searchParams.get('stopCycle')),
    showExpected: isStringBoolean(searchParams.get('showExpected')),
  };
}

/**
 * Hook exposes the schedule component options
 */
export function useScheduleOptions() {
  const [searchParams] = useSearchParams();
  const options = useMemo(() => getScheduleOptionsFromParams(searchParams), [searchParams]);
  return options;
}
