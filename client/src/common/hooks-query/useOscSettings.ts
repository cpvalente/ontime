import { useQuery } from '@tanstack/react-query';

import { OSC_SETTINGS } from '../api/apiConstants';
import { getOSC } from '../api/ontimeApi';
import { oscPlaceholderSettings } from '../models/OscSettings.type';

export default function useOscSettings() {
  const {
    data,
    status,
    isError,
    refetch,
  } = useQuery(OSC_SETTINGS, getOSC, { placeholderData: oscPlaceholderSettings });

  return { data, status, isError, refetch };
}
