import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { OSC_SETTINGS } from '../api/apiConstants';
import { getOSC } from '../api/ontimeApi';
import { oscPlaceholderSettings } from '../models/OscSettings';

export default function useOscSettings() {
  const { data, status, isError, refetch } = useQuery({
    queryKey: OSC_SETTINGS,
    queryFn: getOSC,
    placeholderData: oscPlaceholderSettings,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data, status, isError, refetch };
}
