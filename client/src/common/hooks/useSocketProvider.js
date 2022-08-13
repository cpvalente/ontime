import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { FEAT_EVENTLIST } from '../api/apiConstants';
import { useSocket } from '../context/socketContext';

export const useEventListProvider = () => {
  const queryClient = useQueryClient();
  return queryClient.getQueryData(FEAT_EVENTLIST);
};

export const useSocketProvider = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.emit('get-ontime-feat-eventlist');
    socket.on('ontime-feat-eventlist', (featureData) => {
      queryClient.setQueryData(FEAT_EVENTLIST, () => featureData);
    });

    return() => {
      socket.off('ontime-feat-eventlist')
    }
  }, [queryClient, socket]);
};
