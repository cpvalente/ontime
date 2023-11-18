// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck -- working on it
import { useMutation, useQuery } from '@tanstack/react-query';
import { OSCSettings } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { OSC_SETTINGS } from '../api/apiConstants';
import { logAxiosError } from '../api/apiUtils';
import { getOSC, postOSC, postOscSubscriptions } from '../api/ontimeApi';
import { oscPlaceholderSettings } from '../models/OscSettings';
import { ontimeQueryClient } from '../queryClient';

export default function useOscSettings() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: OSC_SETTINGS,
    queryFn: getOSC,
    placeholderData: oscPlaceholderSettings,
    retry: 5,
    retryDelay: (attempt: number) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  // we need to jump through some hoops because of the type op port
  return { data: data! as unknown as OSCSettings, status, isFetching, isError, refetch };
}

export function useOscSettingsMutation() {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: postOSC,
    onError: (error) => logAxiosError('Error saving OSC settings', error),
    onSuccess: (res) => ontimeQueryClient.setQueryData(OSC_SETTINGS, res.data),
    onSettled: () => ontimeQueryClient.invalidateQueries({ queryKey: OSC_SETTINGS }),
  });
  return { isPending, mutateAsync };
}

export function usePostOscSubscriptions() {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: postOscSubscriptions,
    onError: (error) => logAxiosError('Error saving OSC settings', error),
    onSettled: () => ontimeQueryClient.invalidateQueries({ queryKey: OSC_SETTINGS }),
  });
  return { isPending, mutateAsync };
}
