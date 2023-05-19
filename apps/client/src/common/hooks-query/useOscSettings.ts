import { useMutation, useQuery } from '@tanstack/react-query';
import { OSCSettings } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { OSC_SETTINGS } from '../api/apiConstants';
import { getOSC, postOSC, postOscSubscriptions } from '../api/ontimeApi';
import { oscPlaceholderSettings } from '../models/OscSettings';
import { ontimeQueryClient } from '../queryClient';

export default function useOscSettings() {
  const { data, status, isError, refetch } = useQuery({
    queryKey: OSC_SETTINGS,
    queryFn: getOSC,
    placeholderData: oscPlaceholderSettings,
    retry: 5,
    retryDelay: (attempt: number) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  // we need to jump through some hoops because of the type op port
  return { data: data! as unknown as OSCSettings, status, isError, refetch };
}

export function useOscSettingsMutation() {
  const { isLoading, mutateAsync } = useMutation({
    mutationFn: postOSC,
    onSuccess: (res) => ontimeQueryClient.setQueryData(OSC_SETTINGS, res.data),
    onSettled: () => ontimeQueryClient.invalidateQueries({ queryKey: OSC_SETTINGS }),
  });
  return { isLoading, mutateAsync };
}

export function usePostOscSubscriptions() {
  const { isLoading, mutateAsync } = useMutation({
    mutationFn: postOscSubscriptions,
    onSettled: () => ontimeQueryClient.invalidateQueries({ queryKey: OSC_SETTINGS }),
  });
  return { isLoading, mutateAsync };
}
