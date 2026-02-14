import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { getAutomationSettings } from '../api/automation';
import { AUTOMATION } from '../api/constants';
import { automationPlaceholderSettings } from '../models/AutomationSettings';

export default function useAutomationSettings() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: AUTOMATION,
    queryFn: ({ signal }) => getAutomationSettings({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });

  return { data: data ?? automationPlaceholderSettings, status, isFetching, isError, refetch };
}
