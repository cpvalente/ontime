import { useQuery } from '@tanstack/react-query';

import { APP_INFO } from '../api/apiConstants';
import { getInfo } from '../api/ontimeApi';
import { ontimePlaceholderInfo } from '../models/Info.types';

export default function useInfo() {
  const {
    data,
    status,
    isError,
    refetch,
  } = useQuery(APP_INFO, getInfo, { placeholderData: ontimePlaceholderInfo });

  return { data, status, isError, refetch };
}
