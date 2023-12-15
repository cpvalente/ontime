import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { SHEET } from '../api/apiConstants';
import { getSheetSettings } from '../api/ontimeApi';

const sheetPlaceholder = { worksheet: null, id: null };

export default function useSheet() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: SHEET,
    queryFn: getSheetSettings,
    placeholderData: sheetPlaceholder,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data, status, isFetching, isError, refetch };
}
