import { useQuery } from '@tanstack/react-query';

import { USERFIELDS } from '../api/apiConstants';
import { getUserFields } from '../api/ontimeApi';
import { userFieldsPlaceholder } from '../models/UserFields.type';

export default function useUserFields() {
  const {
    data,
    status,
    isError,
    refetch,
  } = useQuery(USERFIELDS, getUserFields, { placeholderData: userFieldsPlaceholder, retry: 5, retryDelay: attempt => attempt * 2500 });

  return { data, status, isError, refetch };
}
