import { useQuery } from '@tanstack/react-query';

import { APP_SETTINGS } from '../api/apiConstants';
import { getSettings } from '../api/ontimeApi';
import { ontimePlaceholderSettings } from '../models/OntimeSettings.type';

export default function useSettings() {
  const {
    data,
    status,
    isError,
    refetch,
  } = useQuery({
    queryKey: APP_SETTINGS,
    queryFn: getSettings,
    placeholderData: ontimePlaceholderSettings,
    retry: 5,
    retryDelay: attempt => attempt * 2500,
  });

  return { data, status, isError, refetch };
}
