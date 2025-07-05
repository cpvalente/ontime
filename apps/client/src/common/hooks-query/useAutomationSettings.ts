import { useQuery } from '@tanstack/react-query';
import type { AutomationSettings } from 'ontime-types';

import { getAutomationSettings } from '../api/automation';
import { AUTOMATION } from '../api/constants';

const initialData: AutomationSettings = {
  enabledAutomations: false,
  enabledOscIn: false,
  oscPortIn: 8888,
  triggers: [],
  automations: {},
};

export default function useAutomationSettings() {
  const { data, status, isLoading, isError } = useQuery({
    queryKey: AUTOMATION,
    queryFn: getAutomationSettings,
    placeholderData: (previousData, _previousQuery) => previousData,
    initialData,
  });

  return { data, status, isLoading, isError };
}
