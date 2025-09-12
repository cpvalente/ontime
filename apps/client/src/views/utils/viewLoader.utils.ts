import { QueryStatus } from '@tanstack/react-query';

export type ViewData<T> = {
  data: T;
  status: QueryStatus;
};

/**
 * Aggregates a loading status from multiple query statuses.
 * If all statuses are 'pending', returns 'pending'.
 * If all statuses are 'success', returns 'success'.
 * If any status is 'error', returns 'error'.
 */
export function aggregateQueryStatus(statuses: QueryStatus[]): QueryStatus {
  if (statuses.every((status) => status === 'pending')) {
    return 'pending';
  }
  if (statuses.every((status) => status === 'success')) {
    return 'success';
  }
  if (statuses.some((status) => status === 'error')) {
    return 'error';
  }
  return 'pending';
}
