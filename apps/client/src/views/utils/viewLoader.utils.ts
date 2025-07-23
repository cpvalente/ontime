import { QueryStatus } from '@tanstack/react-query';

export type ViewData<T> = {
  data: T;
  status: QueryStatus;
};
