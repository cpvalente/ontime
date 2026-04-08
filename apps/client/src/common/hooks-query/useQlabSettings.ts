import { useMutation, useQuery } from '@tanstack/react-query';
import type { QlabSettings } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { editQlabSettings, getQlabSettings } from '../api/qlab';
import { QLAB } from '../api/constants';
import { logAxiosError } from '../api/utils';
import { ontimeQueryClient } from '../queryClient';

const qlabPlaceholderSettings: QlabSettings = {
  enabled: false,
  host: '127.0.0.1',
  port: 53000,
  listenPort: 53001,
  filterByColor: null,
  filterByType: null,
  filterByCueNumber: null,
  warningThreshold: 30000,
  dangerThreshold: 10000,
  timeout: 3000,
};

export default function useQlabSettings() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: QLAB,
    queryFn: getQlabSettings,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt: number) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data: data ?? qlabPlaceholderSettings, status, isFetching, isError, refetch };
}

export function useQlabSettingsMutation() {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: editQlabSettings,
    onError: (error) => logAxiosError('Error saving QLab settings', error),
    onSuccess: (data) => {
      ontimeQueryClient.setQueryData(QLAB, data);
    },
    onSettled: () => ontimeQueryClient.invalidateQueries({ queryKey: QLAB }),
  });
  return { isPending, mutateAsync };
}
