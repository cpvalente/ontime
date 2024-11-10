import { useQuery } from '@tanstack/react-query';
import { dayInMs } from 'ontime-utils';

import { version } from '../../../../../package.json';
import { APP_VERSION, isLocalhost } from '../api/constants';
import { getLatestVersion, HasUpdate } from '../api/external';

const placeholder: HasUpdate & { hasUpdates: boolean } = { url: '', version: '', hasUpdates: false };

export default function useAppVersion() {
  const {
    data: fetchData,
    status,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: APP_VERSION,
    queryFn: getLatestVersion,
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    staleTime: dayInMs,
    enabled: isLocalhost,
  });

  const hasUpdates = fetchData?.version && !fetchData.version.includes(version);

  const data = fetchData ? { ...fetchData, hasUpdates } : placeholder;

  return { data, placeholder, status, isFetching, isError, refetch };
}
