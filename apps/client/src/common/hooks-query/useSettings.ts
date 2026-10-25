import { useMutation, useQuery } from '@tanstack/react-query';
import { unobfuscate } from 'ontime-utils';

import { APP_SETTINGS } from '../api/constants';
import { getSettings, postSettings } from '../api/settings';
import { ontimePlaceholderSettings } from '../models/OntimeSettings';
import { ontimeQueryClient } from '../queryClient';

export default function useSettings() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: APP_SETTINGS,
    queryFn: ({ signal }) => getSettings({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    select: (data) => {
      const unobfuscated = { ...data };
      if (data.editorKey) {
        unobfuscated.editorKey = unobfuscate(data.editorKey);
      }
      if (data.operatorKey) {
        unobfuscated.operatorKey = unobfuscate(data.operatorKey);
      }
      return unobfuscated;
    },
  });

  return { data: data ?? ontimePlaceholderSettings, status, isFetching, isError, refetch };
}

export function useUpdateSettings() {
  const { mutateAsync } = useMutation({
    mutationFn: postSettings,
    onMutate: () => ontimeQueryClient.cancelQueries({ queryKey: APP_SETTINGS }),
    onError: () => ontimeQueryClient.invalidateQueries({ queryKey: APP_SETTINGS }),
    onSuccess: (newSettings) => {
      ontimeQueryClient.setQueryData(APP_SETTINGS, newSettings);
    },
  });

  return { updateSettings: mutateAsync };
}
