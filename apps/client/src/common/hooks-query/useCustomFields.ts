import { useMutation, useQuery } from '@tanstack/react-query';
import { CustomFieldKey, CustomFields } from 'ontime-types';
import { getCustomFieldsByKey, sortCustomFields } from 'ontime-utils';
import { useMemo } from 'react';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { CUSTOM_FIELDS } from '../api/constants';
import { getCustomFields, reorderCustomFields } from '../api/customFields';
import { ontimeQueryClient } from '../queryClient';

const placeholder: CustomFields = [];

/**
 * Exposes the custom fields in the project order, and by key for lookups
 */
export default function useCustomFields() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: CUSTOM_FIELDS,
    queryFn: ({ signal }) => getCustomFields({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });

  const fields = data ?? placeholder;
  const fieldsByKey = useMemo(() => getCustomFieldsByKey(fields), [fields]);

  return { data: fields, fieldsByKey, status, isFetching, isError, refetch };
}

/**
 * Reorders the custom fields, showing the new order before the server confirms it
 */
export function useReorderCustomFields() {
  const { mutate } = useMutation({
    mutationFn: reorderCustomFields,
    onMutate: async (order: CustomFieldKey[]) => {
      await ontimeQueryClient.cancelQueries({ queryKey: CUSTOM_FIELDS });
      const previous = ontimeQueryClient.getQueryData<CustomFields>(CUSTOM_FIELDS);
      if (previous) {
        ontimeQueryClient.setQueryData<CustomFields>(CUSTOM_FIELDS, sortCustomFields(previous, order));
      }
      return { previous };
    },
    onError: (_error, _order, context) => {
      if (context?.previous) {
        ontimeQueryClient.setQueryData(CUSTOM_FIELDS, context.previous);
      }
      // the fields may have changed elsewhere, which is a common reason for the server to reject the order
      void ontimeQueryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS });
    },
    onSuccess: (customFields) => {
      ontimeQueryClient.setQueryData(CUSTOM_FIELDS, customFields);
    },
  });

  return mutate;
}
