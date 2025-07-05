import { useQuery } from '@tanstack/react-query';
import { dayInMs } from 'ontime-utils';

import { version } from '../../../../../package.json';
import { isLocalhost } from '../../externals';
import { APP_VERSION } from '../api/constants';
import { getLatestVersion, HasUpdate } from '../api/external';

const initialData: HasUpdate & { hasUpdates: boolean } = { url: '', version: '', hasUpdates: false };

export default function useAppVersion() {
  const { data: fetchData, isError } = useQuery({
    queryKey: APP_VERSION,
    queryFn: getLatestVersion,
    placeholderData: (previousData, _previousQuery) => previousData,
    // this is a very lazy piece of data therefore we very really ask it to refetch
    refetchOnReconnect: false,
    retry: false,
    staleTime: dayInMs,
    initialData,
    enabled: isLocalhost,
  });

  const hasUpdates = fetchData?.version && !fetchData.version.includes(version);

  const data = { ...fetchData, hasUpdates };

  return { data, isError };
}
