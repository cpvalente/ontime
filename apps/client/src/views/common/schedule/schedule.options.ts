import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { OptionTitle } from '../../../common/components/view-params-editor/constants';
import { ViewOption } from '../../../common/components/view-params-editor/types';
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
      id: 'showProjected',
      title: 'Show projected time',
      description: 'Whether scheduled times should account for runtime offset.',
      type: 'boolean',
      defaultValue: false,
    },
  ],
};

type ScheduleOptions = {
  cycleInterval: number;
  stopCycle: boolean;
  showProjected: boolean;
};

function getScheduleOptionsFromParams(searchParams: URLSearchParams): ScheduleOptions {
  return {
    cycleInterval: Number(searchParams.get('cycleInterval')) || 10,
    stopCycle: isStringBoolean(searchParams.get('stopCycle')),
    showProjected: isStringBoolean(searchParams.get('showProjected')),
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
