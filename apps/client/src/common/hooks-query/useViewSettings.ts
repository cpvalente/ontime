import { useMutation, useQuery } from '@tanstack/react-query';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { getViewSettings, postViewSettings } from '../../common/api/viewSettings';
import { ontimeQueryClient } from '../../common/queryClient';
import { VIEW_SETTINGS } from '../api/constants';
import { viewsSettingsPlaceholder } from '../models/ViewSettings.type';

export default function useViewSettings() {
  const { data, status } = useQuery({
    queryKey: VIEW_SETTINGS,
    queryFn: getViewSettings,
    placeholderData: (previousData, _previousQuery) => previousData,
    staleTime: MILLIS_PER_HOUR,
  });

  const { mutateAsync } = useMutation({
    mutationFn: postViewSettings,
    onMutate: () => {
      ontimeQueryClient.cancelQueries({ queryKey: VIEW_SETTINGS });
    },
    onSuccess: (data) => {
      ontimeQueryClient.setQueryData(VIEW_SETTINGS, data);
    },
  });

  return { data: data ?? viewsSettingsPlaceholder, status, mutateAsync };
}
