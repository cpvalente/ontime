import { useQuery } from '@tanstack/react-query';

import { SHEET_STATE } from '../api/apiConstants';
import { getSheetState } from '../api/ontimeApi';

export default function useSheetState() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: SHEET_STATE,
    queryFn: getSheetState,
    placeholderData: null,
    enabled: false,
    networkMode: 'always',
  });

  return { data, status, isFetching, isError, refetch };
}
