import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { VIEW_SETTINGS } from '../api/apiConstants';
import { getView } from '../api/ontimeApi';
import { viewsSettingsPlaceholder } from '../models/ViewSettings.type';

export default function useViewSettings() {
  const { data, status, isError, refetch } = useQuery({
    queryKey: VIEW_SETTINGS,
    queryFn: getView,
    placeholderData: viewsSettingsPlaceholder,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data, status, isError, refetch };
}
