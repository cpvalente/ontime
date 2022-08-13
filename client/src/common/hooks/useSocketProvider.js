import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  FEAT_EVENTLIST,
  FEAT_INFO,
  FEAT_MESSAGECONTROL,
  FEAT_PLAYBACKCONTROL,
} from '../api/apiConstants';
import { useSocket } from '../context/socketContext';

export const useEventListProvider = () => {
  const { data } = useQuery(FEAT_EVENTLIST, () => undefined);
  const placeholder = {
    selectedEventId: null,
    nextEventId: null,
  };
  return data ?? placeholder;
};

export const useMessageControlProvider = () => {
  const socket = useSocket();
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

  const returnData = data ?? placeholder;

  const patch = useCallback(
    (action, payload) => {
      switch (action) {
        case 'pres-text':
          socket.emit('set-timer-message-text', payload);
          break;
        case 'toggle-pres-visible':
          socket.emit('set-timer-message-visible', payload);
          break;
        case 'publ-text':
          socket.emit('set-public-message-text', payload);
          break;
        case 'toggle-publ-visible':
          socket.emit('set-public-message-visible', payload);
          break;
        case 'lower-text':
          socket.emit('set-lower-message-text', payload);
          break;
        case 'toggle-lower-visible':
          socket.emit('set-lower-message-visible', payload);
          break;
        case 'toggle-onAir':
          socket.emit('set-onAir', payload);
          break;
        default:
          break;
      }
    },
    [socket]
  );

  return { data: returnData, patch };
};

export const usePlaybackControlProvider = () => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const { data } = useQuery(FEAT_PLAYBACKCONTROL, () => undefined);
  const placeholder = {
    timer: {
      running: null,
      startedAt: null,
      expectedFinish: null,
      secondary: null,
    },
    playback: 'stop',
    selectedEventId: null,
    numEvents: 0,
  };

  const resetData = useCallback(() => {
    queryClient.setQueryData(FEAT_PLAYBACKCONTROL, () => placeholder);
  }, [placeholder, queryClient]);

  const setPlayback = {
    start: () => socket.emit('set-playstate', 'start'),
    pause: () => socket.emit('set-playstate', 'pause'),
    roll: () => socket.emit('set-playstate', 'roll'),
    previous: () => {
      socket.emit('set-playstate', 'next');
      resetData();
    },
    next: () => {
      socket.emit('set-playstate', 'next');
      resetData();
    },
    unload: () => {
      socket.emit('set-playstate', 'unload');
      resetData();
    },
    reload: () => {
      socket.emit('set-playstate', 'reload');
      resetData();
    },
    delay: (amount) => {
      socket.emit('set-delay', amount)
    }
  }

  const returnData = data ?? placeholder;

  return { data: returnData, resetData, setPlayback };
};

export const useInfoProvider = () => {
  const { data } = useQuery(FEAT_INFO, () => undefined);
  const placeholder = {
    titles: {
      titleNow: '',
      subtitleNow: '',
      presenterNow: '',
      noteNow: '',
      titleNext: '',
      subtitleNext: '',
      presenterNext: '',
      noteNext: '',
    },
    playback: 'stop',
    selectedEventId: null,
    selectedEventIndex: null,
    numEvents: 0,
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

    socket.emit('get-ontime-feat-playbackcontrol');
    socket.on('ontime-feat-playbackcontrol', (featureData) => {
      queryClient.setQueryData(FEAT_PLAYBACKCONTROL, () => featureData);
    });

    socket.emit('get-ontime-feat-info');
    socket.on('ontime-feat-info', (featureData) => {
      queryClient.setQueryData(FEAT_INFO, () => featureData);
    });

    return () => {
      socket.off('ontime-feat-eventlist');
      socket.off('ontime-feat-messagecontrol');
      socket.off('ontime-feat-playbackcontrol');
      socket.off('ontime-feat-info');
    };
  }, [queryClient, socket]);
};
