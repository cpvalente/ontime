import { useQuery } from '@tanstack/react-query';
import { type CustomViewsListResponse } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { CUSTOM_VIEWS } from '../api/constants';
import { getCustomViews } from '../api/customViews';

const placeholderCustomViews: CustomViewsListResponse = {
  views: [],
};

export default function useCustomViews() {
  const { data, status, refetch } = useQuery({
    queryKey: CUSTOM_VIEWS,
    queryFn: ({ signal }) => getCustomViews({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });

  return { data: data ?? placeholderCustomViews, status, refetch };
}
