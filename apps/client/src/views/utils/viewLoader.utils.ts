import { QueryStatus } from '@tanstack/react-query';

export type ViewData<T> = {
  data: T;
  status: QueryStatus;
};

type AggregatableQuery = {
  status: QueryStatus;
  /** true only when the query has never received data, ie useQuery's isLoadingError */
  isLoadingError: boolean;
};

/**
 * Aggregates a loading status from multiple queries, for the purpose of deciding
 * whether a view can render.
 * - 'pending' while any query hasn't settled yet (no result, first fetch in flight)
 * - 'error' once all queries have settled, if any of them never received data
 * - 'success' once all queries have settled and every one has data to show,
 *   even if a query's last (background) fetch failed
 */
export function aggregateQueryStatus(queries: AggregatableQuery[]): QueryStatus {
  const allSettled = queries.every((query) => query.status !== 'pending');
  if (!allSettled) {
    return 'pending';
  }
  if (queries.some((query) => query.isLoadingError)) {
    return 'error';
  }
  return 'success';
}
