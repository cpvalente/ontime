import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { FEAT_EVENTLIST, FEAT_MESSAGECONTROL } from '../api/apiConstants';
import { useSocket } from '../context/socketContext';

export const useEventListProvider = () => {
  const { data } = useQuery(FEAT_EVENTLIST, () => undefined);
  return data;
};

export const useMessageControlProvider = () => {
  const { data } = useQuery(FEAT_MESSAGECONTROL, () => undefined);
  const placeholder = {
    presenter: {
      text: '',
      visible: false,
    },
    public: {
      text: '',
      visible: false,
    },
    lower: {
      text: '',
      visible: false,
    },
    onAir: false,
  };
  return data ?? placeholder;
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

    socket.emit('get-ontime-feat-messagecontrol');
    socket.on('ontime-feat-messagecontrol', (featureData) => {
      queryClient.setQueryData(FEAT_MESSAGECONTROL, () => featureData);
    });

    return () => {
      socket.off('ontime-feat-eventlist');
      socket.off('ontime-feat-messagecontrol');
    };
  }, [queryClient, socket]);
};
