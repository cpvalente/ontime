import { useMutation, useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { OSC_SETTINGS } from '../api/apiConstants';
import { logAxiosError } from '../api/apiUtils';
import { getOSC, postOSC, postOscSubscriptions } from '../api/ontimeApi';
import { oscPlaceholderSettings } from '../models/OscSettings';
import { ontimeQueryClient } from '../queryClient';

export default function useOscSettings() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: OSC_SETTINGS,
    queryFn: async () => {
      const oscData = await getOSC();
      return { ...oscData, portIn: String(oscData.portIn), portOut: String(oscData.portOut) };
    },
    placeholderData: oscPlaceholderSettings,
    retry: 5,
    retryDelay: (attempt: number) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data: data ?? oscPlaceholderSettings, status, isFetching, isError, refetch };
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
