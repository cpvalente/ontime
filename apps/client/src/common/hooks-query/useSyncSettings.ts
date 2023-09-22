import { useQuery } from '@tanstack/react-query';

import { syncSettingsPlaceholder } from '../../common/models/SyncSettings.type';
import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { SYNC_SETTINGS } from '../api/apiConstants';
import { getSyncSettings } from '../api/ontimeApi';

export default function useSyncSettings() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: SYNC_SETTINGS,
    queryFn: getSyncSettings,
    placeholderData: syncSettingsPlaceholder,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data, status, isError, refetch, isFetching };
}
