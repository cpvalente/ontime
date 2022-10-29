import { useMutation, useQueryClient } from '@tanstack/react-query';

import { RUNDOWN_TABLE } from '../api/apiConstants';

/**
 * @description utility hook to handle mutations in events
 * @param mutation
 */
export default function useMutateEvents(mutation){
  const queryClient = useQueryClient();
  return useMutation(mutation, {
    onMutate: async (newEvent) => {
      // cancel ongoing queries
      queryClient.cancelQueries(RUNDOWN_TABLE, { exact: true });

      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData([RUNDOWN_TABLE, newEvent.id]);

      // optimistically update object
      queryClient.setQueryData([RUNDOWN_TABLE, newEvent.id], newEvent);

      // Return a context with the previous and new event
      return { previousEvent, newEvent };
    },

    // Mutation fails, rollback undoes optimist update
    onError: (error, newEvent, context) => {
      queryClient.setQueryData([RUNDOWN_TABLE, context.newEvent.id], context.previousEvent);
    },

    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: (newEvent) => {
      queryClient.invalidateQueries([RUNDOWN_TABLE, newEvent.id]);
    },
  });
}