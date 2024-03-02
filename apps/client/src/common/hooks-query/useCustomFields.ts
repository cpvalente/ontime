import { useQuery } from '@tanstack/react-query';
import { CustomFields } from 'ontime-types';

import { queryRefetchInterval } from '../../ontimeConfig';
import { CUSTOM_FIELDS } from '../api/constants';
import { getCustomFields } from '../api/customFields';

const placeholder: CustomFields = {};

export default function useCustomFields() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: CUSTOM_FIELDS,
    queryFn: getCustomFields,
    placeholderData: placeholder,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchInterval,
    networkMode: 'always',
  });

  return { data: data ?? placeholder, status, isFetching, isError, refetch };
}
