import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { OptionTitle } from '../../../common/components/view-params-editor/constants';
import { ViewOption } from '../../../common/components/view-params-editor/viewParams.types';
import { isStringBoolean } from '../../../features/viewers/common/viewUtils';

export const scheduleOptions: ViewOption = {
  title: OptionTitle.Schedule,
  collapsible: true,
  options: [
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
};

type ScheduleOptions = {
  cycleInterval: number;
  stopCycle: boolean;
  showExpected: boolean;
};

function getScheduleOptionsFromParams(searchParams: URLSearchParams): ScheduleOptions {
  return {
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
