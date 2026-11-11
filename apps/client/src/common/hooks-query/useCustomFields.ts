import { useMutation, useQuery } from '@tanstack/react-query';
import { CustomFieldKey, OrderedCustomFields, ProjectCustomFields } from 'ontime-types';
import { useMemo } from 'react';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { CUSTOM_FIELDS } from '../api/constants';
import { getCustomFields, reorderCustomFields } from '../api/customFields';
import { ontimeQueryClient } from '../queryClient';

const placeholder: ProjectCustomFields = { fields: {}, order: [] };

/**
 * Exposes the custom fields for lookups by key
 * and the ordered list for anything which presents them
 */
export default function useCustomFields() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: CUSTOM_FIELDS,
    queryFn: ({ signal }) => getCustomFields({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });

  const projectCustomFields = data ?? placeholder;
  const orderedFields = useMemo<OrderedCustomFields>(
    () =>
      projectCustomFields.order
        // an optimistic order can briefly list a field another client deleted
        .filter((key) => Object.hasOwn(projectCustomFields.fields, key))
        .map((key) => [key, projectCustomFields.fields[key]]),
    [projectCustomFields],
  );

  return { data: projectCustomFields.fields, orderedFields, status, isFetching, isError, refetch };
}

/**
 * Reorders the custom fields, showing the new order before the server confirms it
 */
const reorderMutationKey = [...CUSTOM_FIELDS, 'order'];

export function useReorderCustomFields() {
  const { mutate } = useMutation({
    mutationKey: reorderMutationKey,
    mutationFn: reorderCustomFields,
    onMutate: async (order: CustomFieldKey[]) => {
      await ontimeQueryClient.cancelQueries({ queryKey: CUSTOM_FIELDS });
      const previous = ontimeQueryClient.getQueryData<ProjectCustomFields>(CUSTOM_FIELDS);
      if (previous) {
        ontimeQueryClient.setQueryData<ProjectCustomFields>(CUSTOM_FIELDS, { ...previous, order });
      }
      return { previous };
    },
    onError: (_error, _order, context) => {
      // a later reorder is already showing, the refetch below settles on what the server kept
      if (context?.previous && !hasOtherReorderPending()) {
        ontimeQueryClient.setQueryData(CUSTOM_FIELDS, context.previous);
      }
      // the fields may have changed elsewhere, which is a common reason for the server to reject the order
      void ontimeQueryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS });
    },
    onSuccess: (projectCustomFields) => {
      // writing this response would briefly undo the order of a later drag which is still in flight
      if (!hasOtherReorderPending()) {
        ontimeQueryClient.setQueryData(CUSTOM_FIELDS, projectCustomFields);
      }
    },
  });

  return mutate;
}

/** Whether reorders other than the one settling are still waiting for the server */
function hasOtherReorderPending(): boolean {
  return ontimeQueryClient.isMutating({ mutationKey: reorderMutationKey }) > 1;
}
