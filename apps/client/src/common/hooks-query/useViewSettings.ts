import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { VIEW_SETTINGS } from '../api/constants';
import { getView } from '../api/viewSettings';
import { viewsSettingsPlaceholder } from '../models/ViewSettings.type';

export default function useViewSettings() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: VIEW_SETTINGS,
    queryFn: getView,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data: data ?? viewsSettingsPlaceholder, status, isError, refetch, isFetching };
}
