import { useQuery } from '@tanstack/react-query';

import { VIEW_SETTINGS } from '../api/apiConstants';
import { getView } from '../api/ontimeApi';
import { viewsSettingsPlaceholder } from '../models/ViewSettings.type';

export default function useViewSettings() {
  const {
    data,
    status,
    isError,
    refetch,
  } = useQuery(VIEW_SETTINGS, getView, { placeholderData: viewsSettingsPlaceholder });

  return { data, status, isError, refetch };
}
