import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { SelectOption } from '../../../common/components/select/Select';
import { OptionTitle } from '../../../common/components/view-params-editor/constants';
import type { ViewOption } from '../../../common/components/view-params-editor/viewParams.types';
import { makeViewParamsReader } from '../../../common/components/view-params-editor/viewParams.utils';
import { PresetContext } from '../../../common/context/PresetContext';
import { isStringBoolean } from '../viewUtils';

export const getScheduleOptions = (customFieldOptions: SelectOption[]): ViewOption => ({
  title: OptionTitle.Schedule,
  collapsible: true,
  options: [
    {
      id: 'filter',
      title: 'Filter',
      description: 'Hides events without data in the selected custom field',
      type: 'option',
      values: customFieldOptions,
      defaultValue: 'none',
    },
    {
      id: 'stopCycle',
      title: 'Stop cycling through event pages',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'cycleInterval',
      title: 'Cycle interval',
      description: 'Seconds each schedule page is shown',
      type: 'number',
      defaultValue: 10,
    },
    {
      id: 'showExpected',
      title: 'Show expected times',
      description: 'Times account for the runtime offset',
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
  const params = makeViewParamsReader(searchParams, defaultValues);

  return {
    filter: params.get('filter'),
    cycleInterval: Number(params.get('cycleInterval')) || 10,
    stopCycle: isStringBoolean(params.get('stopCycle')),
    showExpected: isStringBoolean(params.get('showExpected')),
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
