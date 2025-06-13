import { useMutation, useQuery } from '@tanstack/react-query';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { maybeAxiosError } from '../../common/api/utils';
import { getViewSettings, postViewSettings } from '../../common/api/viewSettings';
import { ontimeQueryClient } from '../../common/queryClient';
import { VIEW_SETTINGS } from '../api/constants';
import { viewsSettingsPlaceholder } from '../models/ViewSettings.type';

export default function useViewSettings() {
  const { data, isFetching } = useQuery({
    queryKey: VIEW_SETTINGS,
    queryFn: getViewSettings,
    placeholderData: (previousData, _previousQuery) => previousData,
    staleTime: MILLIS_PER_HOUR,
  });

  const { mutate, error } = useMutation({
    mutationFn: postViewSettings,
    onSuccess: (data) => {
      ontimeQueryClient.setQueryData(VIEW_SETTINGS, data);
    },
  });

  const mutateError = error ? maybeAxiosError(error) : '';

  return { data: data ?? viewsSettingsPlaceholder, mutate, isFetching, mutateError };
}
