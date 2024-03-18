import { useQuery } from '@tanstack/react-query';
import { PresetEvents } from 'ontime-types';

import { queryRefetchInterval } from '../../ontimeConfig';
import { PRESET_SETTINGS } from '../api/constants';
import { getPresetEvents } from '../api/presetEvents';

const placeholder: PresetEvents = {};

export default function usePresetEvents() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: PRESET_SETTINGS,
    queryFn: getPresetEvents,
    placeholderData: placeholder,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchInterval,
    networkMode: 'always',
  });

  return { data: data ?? placeholder, status, isFetching, isError, refetch };
}
