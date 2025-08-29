import { useQuery } from '@tanstack/react-query';
import { unobfuscate } from 'ontime-utils';

import { APP_SETTINGS } from '../api/constants';
import { getSettings } from '../api/settings';
import { ontimePlaceholderSettings } from '../models/OntimeSettings';

export default function useSettings() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: APP_SETTINGS,
    queryFn: getSettings,
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
