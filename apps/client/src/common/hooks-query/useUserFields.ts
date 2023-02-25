import { useQuery } from '@tanstack/react-query';

import { queryRefetchInterval } from '../../ontimeConfig';
import { USERFIELDS } from '../api/apiConstants';
import { getUserFields } from '../api/ontimeApi';
import { userFieldsPlaceholder } from '../models/UserFields';

export default function useUserFields() {
  const { data, status, isError, refetch } = useQuery({
    queryKey: USERFIELDS,
    queryFn: getUserFields,
    placeholderData: userFieldsPlaceholder,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchInterval,
    networkMode: 'always',
  });

  return { data, status, isError, refetch };
}
