import { useMutation, useQuery } from '@tanstack/react-query';
import { defaultTeleprompterSettings, MILLIS_PER_HOUR } from 'ontime-utils';

import { TELEPROMPTER_SETTINGS } from '../api/constants';
import { getTeleprompterSettings, postTeleprompterSettings } from '../api/teleprompter';
import { ontimeQueryClient } from '../queryClient';

export default function useTeleprompterSettings() {
  const { data, status } = useQuery({
    queryKey: TELEPROMPTER_SETTINGS,
    queryFn: ({ signal }) => getTeleprompterSettings({ signal }),
    placeholderData: (previousData) => previousData,
    staleTime: MILLIS_PER_HOUR,
  });

  const { mutateAsync } = useMutation({
    mutationFn: postTeleprompterSettings,
    onMutate: () => {
      ontimeQueryClient.cancelQueries({ queryKey: TELEPROMPTER_SETTINGS });
    },
    onSuccess: (data) => {
      ontimeQueryClient.setQueryData(TELEPROMPTER_SETTINGS, data);
    },
  });

  return { data: data ?? defaultTeleprompterSettings, status, mutateAsync };
}
