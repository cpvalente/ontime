import { useQuery } from '@tanstack/react-query';
import { dayInMs } from 'ontime-utils';

import { version } from '../../../../../package.json';
import { isLocalhost } from '../../externals';
import { APP_VERSION } from '../api/constants';
import { HasUpdate, getLatestVersion } from '../api/external';

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
    queryFn: ({ signal }) => getLatestVersion({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    staleTime: dayInMs,
    enabled: isLocalhost,
  });

  const hasUpdates = fetchData?.version ? isUpdate(fetchData.version, version) : false;

  const data = fetchData ? { ...fetchData, hasUpdates } : placeholder;

  return { data, placeholder, status, isFetching, isError, refetch };
}

/**
 * Whether the latest release is an update for the running version
 * The latest release excludes prereleases, so a newer major prerelease (eg: 5.0.0-alpha.0) would see an older major as different
 * we never offer an older major as an update
 */
export function isUpdate(latestTag: string, runningVersion: string): boolean {
  const latest = latestTag.replace(/^v/, '');
  if (latest === runningVersion) return false;
  return Number(latest.split('.')[0]) >= Number(runningVersion.split('.')[0]);
}
