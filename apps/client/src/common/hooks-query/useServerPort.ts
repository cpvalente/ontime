import { useMutation, useQuery } from '@tanstack/react-query';
import { PortInfo } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { APP_SERVER_PORT } from '../api/constants';
import { getServerPort, postServerPort } from '../api/settings';
import { ontimeQueryClient } from '../queryClient';

const serverPortPlaceholder: PortInfo = {
  port: 4001,
  pendingRestart: false,
};

export default function useServerPort() {
  const { data, status, isError, refetch } = useQuery<PortInfo>({
    queryKey: APP_SERVER_PORT,
    queryFn: ({ signal }) => getServerPort({ signal }),
    placeholderData: (previousData) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });

  const { mutateAsync } = useMutation({
    mutationFn: async (serverPort: number) => {
      const response = await postServerPort(serverPort);
      return response.data;
    },
    onMutate: () => {
      ontimeQueryClient.cancelQueries({ queryKey: APP_SERVER_PORT });
    },
    onSuccess: (newData) => {
      ontimeQueryClient.setQueryData(APP_SERVER_PORT, newData);
    },
  });

  return { data: data ?? serverPortPlaceholder, status, isError, refetch, mutateAsync };
}
