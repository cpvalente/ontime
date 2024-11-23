import { useMutation, useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { editAutomationSettings, getAutomationSettings } from '../api/automation';
import { AUTOMATION } from '../api/constants';
import { logAxiosError } from '../api/utils';
import { automationPlaceholderSettings } from '../models/AutomationSettings';
import { ontimeQueryClient } from '../queryClient';

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

export function useAutomationSettingsMutation() {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: editAutomationSettings,
    onError: (error) => logAxiosError('Error saving Automation settings', error),
    onSuccess: (data) => {
      ontimeQueryClient.setQueryData(AUTOMATION, data);
    },
    onSettled: () => ontimeQueryClient.invalidateQueries({ queryKey: AUTOMATION }),
  });
  return { isPending, mutateAsync };
}
