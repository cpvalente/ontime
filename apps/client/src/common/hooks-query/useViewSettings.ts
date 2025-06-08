import { useMutation, useQuery } from '@tanstack/react-query';
import { MaybeNumber, ViewSettings } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { maybeAxiosError } from '../../common/api/utils';
import { ontimeQueryClient } from '../../common/queryClient';
import { apiEntryUrl, axiosInstance, VIEW_SETTINGS } from '../api/constants';
import { viewsSettingsPlaceholder } from '../models/ViewSettings.type';

let etag: MaybeNumber = -1;
const viewSettingsPath = apiEntryUrl + '/view-settings';

export default function useViewSettings() {
  const { data, isFetching } = useQuery({
    queryKey: VIEW_SETTINGS,
    queryFn: async ({ signal }): Promise<ViewSettings | undefined> => {
      const res = await axiosInstance.get(viewSettingsPath, { headers: { ['if-none-match']: `${etag}` }, signal });
      if (res.status === 304) {
        //
        const previousData = ontimeQueryClient.getQueryData(VIEW_SETTINGS) as ViewSettings;
        return previousData;
      }
      etag = res.headers.etag ? Number(res.headers.etag) : null;
      return res.data as ViewSettings;
    },
    placeholderData: (previousData, _previousQuery) => previousData,
    staleTime: MILLIS_PER_HOUR,
  });

  const { mutate, error } = useMutation({
    mutationFn: async (data: ViewSettings) => {
      await ontimeQueryClient.cancelQueries({ queryKey: viewSettingsPath });
      const res = await axiosInstance.post(viewSettingsPath, data);
      etag = res.headers.etag;
      return res.data as ViewSettings;
    },
    onSuccess: (data) => {
      ontimeQueryClient.setQueryData(VIEW_SETTINGS, data);
    },
  });

  const mutateError = maybeAxiosError(error);

  return { data: data ?? viewsSettingsPlaceholder, mutate, isFetching, mutateError };
}

/**
 * invalidate depending on revision
 */
export async function refetchViewSettings(revision: MaybeNumber) {
  if (!revision || revision !== Number(etag)) {
    await ontimeQueryClient.invalidateQueries({ queryKey: VIEW_SETTINGS });
  }
}

/**
 * invalidate and reset revision
 */
export async function invalidateViewSettings() {
  etag = -1;
  await ontimeQueryClient.invalidateQueries({ queryKey: VIEW_SETTINGS });
}
