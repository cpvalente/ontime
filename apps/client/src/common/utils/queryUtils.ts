import type { QueryStatus } from '@tanstack/react-query';

/**
 * A background refetch failure still leaves the last successfully fetched data in place.
 * In that case we want callers to keep treating the query as usable rather than erroring out,
 * so we only report 'error' when we have never received data for this query.
 */
export function deriveQueryStatus(status: QueryStatus, data: unknown): QueryStatus {
  if (status === 'error' && data !== undefined) {
    return 'success';
  }
  return status;
}
