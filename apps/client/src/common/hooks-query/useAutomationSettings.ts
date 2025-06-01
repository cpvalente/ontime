import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { getAutomationSettings } from '../api/automation';
import { AUTOMATION } from '../api/constants';
import { automationPlaceholderSettings } from '../models/AutomationSettings';

export default function useAutomationSettings() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: AUTOMATION,
    queryFn: getAutomationSettings,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt: number) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data: data ?? automationPlaceholderSettings, status, isFetching, isError, refetch };
}
