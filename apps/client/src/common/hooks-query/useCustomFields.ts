import { useQuery } from '@tanstack/react-query';
// CustomFields record type is no longer used here
import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { CUSTOM_FIELDS } from '../api/constants';
import { getCustomFields, CustomFieldWithKey } from '../api/customFields'; // Import CustomFieldWithKey

const placeholder: CustomFieldWithKey[] = []; // Placeholder is now an empty array

export default function useCustomFields() {
  // Explicitly type the useQuery hook
  const { data, status, isFetching, isError, refetch } = useQuery<CustomFieldWithKey[], Error>({
    queryKey: CUSTOM_FIELDS,
    queryFn: getCustomFields,
    placeholderData: (previousData, _previousQuery) => previousData ?? placeholder,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data: data ?? placeholder, status, isFetching, isError, refetch };
}
