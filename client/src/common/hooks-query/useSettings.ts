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
  } = useQuery(APP_SETTINGS, getSettings, { placeholderData: ontimePlaceholderSettings });

  return { data, status, isError, refetch };
}
