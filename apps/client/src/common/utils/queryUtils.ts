import type { QueryStatus } from '@tanstack/react-query';

/**
 * A background refetch failure (react-query's isRefetchError) still leaves the last
 * successfully fetched data in place, so we want callers to keep treating the query as
 * usable rather than erroring out. Only a genuine isLoadingError (never received data)
 * should surface as 'error'.
 */
export function deriveQueryStatus(status: QueryStatus, isLoadingError: boolean): QueryStatus {
  if (status === 'error' && !isLoadingError) {
    return 'success';
  }
  return status;
}
