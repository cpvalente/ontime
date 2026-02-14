import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OntimeView, URLPreset } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { URL_PRESETS } from '../api/constants';
import { deleteUrlPreset, getUrlPresets, postUrlPreset, putUrlPreset } from '../api/urlPresets';

interface FetchProps {
  skip?: boolean;
}

export default function useUrlPresets({ skip = false }: FetchProps = {}) {
  const { data, status, isError, refetch } = useQuery({
    queryKey: URL_PRESETS,
    queryFn: ({ signal }) => getUrlPresets({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
    enabled: !skip,
  });

  return { data: data ?? [], status, isError, refetch };
}

export function useViewUrlPresets(view: OntimeView) {
  const { data } = useUrlPresets();

  const viewPresets = useMemo(() => data.filter((preset) => preset.target === view), [data, view]);

  return { viewPresets };
}

export function useUpdateUrlPreset() {
  const queryClient = useQueryClient();

  const addFn = useMutation({
    mutationFn: postUrlPreset,
    onSuccess: (newPresets) => {
      queryClient.setQueryData(URL_PRESETS, newPresets);
    },
  });

  const updateFn = useMutation({
    mutationFn: ({ alias, data }: { alias: string; data: URLPreset }) => putUrlPreset(alias, data),
    onSuccess: (newPresets) => {
      queryClient.setQueryData(URL_PRESETS, newPresets);
    },
  });

  const deleteFn = useMutation({
    mutationFn: deleteUrlPreset,
    onSuccess: (newPresets) => {
      queryClient.setQueryData(URL_PRESETS, newPresets);
    },
  });

  return {
    addPreset: addFn.mutateAsync,
    updatePreset: (alias: string, data: URLPreset) => updateFn.mutateAsync({ alias, data }),
    deletePreset: deleteFn.mutateAsync,
    isMutating: addFn.isPending || updateFn.isPending || deleteFn.isPending,
    isMutationError: addFn.isError || updateFn.isError || deleteFn.isError,
  };
}
