import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  FEAT_CUESHEET,
  FEAT_INFO,
  FEAT_MESSAGECONTROL,
  FEAT_PLAYBACKCONTROL,
  FEAT_RUNDOWN,
  TIMER,
} from '../api/apiConstants';
import { useSocket } from '../context/socketContext';

export const useRundownProvider = () => {
  const { data } = useQuery(FEAT_RUNDOWN, () => undefined, {
    cacheTime: Infinity,
    staleTime: Infinity,
  });
  const placeholder = useMemo(
    () => ({
      selectedEventId: null,
      nextEventId: null,
      playback: null,
    }),
    [],
  );
  return data ?? placeholder;
};

export const useMessageControlProvider = () => {
  const socket = useSocket();
  const { data } = useQuery(FEAT_MESSAGECONTROL, () => undefined, {
    cacheTime: Infinity,
    staleTime: Infinity,
  });
  const placeholder = useMemo(
    () => ({
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
    }),
    [],
  );

  const returnData = data ?? placeholder;

  const setMessage = useMemo(
    () => ({
      presenterText: (payload) => socket.emit('set-timer-message-text', payload),
      presenterVisible: (payload) => socket.emit('set-timer-message-visible', payload),
      publicText: (payload) => socket.emit('set-public-message-text', payload),
      publicVisible: (payload) => socket.emit('set-public-message-visible', payload),
      lowerText: (payload) => socket.emit('set-lower-message-text', payload),
      lowerVisible: (payload) => socket.emit('set-lower-message-visible', payload),
      onAir: (payload) => socket.emit('set-onAir', payload),
    }),
    [socket],
  );

  return { data: returnData, setMessage };
};

export const usePlaybackControlProvider = () => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const { data } = useQuery(FEAT_PLAYBACKCONTROL, () => undefined, {
    cacheTime: Infinity,
    staleTime: Infinity,
  });
  const placeholder = useMemo(
    () => ({
      playback: 'stop',
      selectedEventId: null,
      numEvents: 0,
    }),
    [],
  );

  const resetData = useCallback(() => {
    queryClient.setQueryData(FEAT_PLAYBACKCONTROL, (data) => ({
      ...data,
      playback: 'stop',
      selectedEventId: null,
    }));
  }, [queryClient]);

  const setPlayback = useMemo(
    () => ({
      start: () => socket.emit('set-start'),
      pause: () => socket.emit('set-pause'),
      roll: () => socket.emit('set-roll'),
      previous: () => {
        socket.emit('set-previous');
        resetData();
      },
      next: () => {
        socket.emit('set-next');
        resetData();
      },
      stop: () => {
        socket.emit('set-stop');
        resetData();
      },
      reload: () => {
        socket.emit('set-reload');
        resetData();
      },
      delay: (amount) => {
        socket.emit('set-delay', amount);
      },
    }),
    [resetData, socket],
  );

  const returnData = data ?? placeholder;

  return { data: returnData, resetData, setPlayback };
};

export const useInfoProvider = () => {
  const { data } = useQuery(FEAT_INFO, () => undefined, {
    cacheTime: Infinity,
    staleTime: Infinity,
  });
  const placeholder = useMemo(
    () => ({
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
    }),
    [],
  );
  return data ?? placeholder;
};

export const useCuesheetProvider = () => {
  const { data } = useQuery(FEAT_CUESHEET, () => undefined, {
    cacheTime: Infinity,
    staleTime: Infinity,
  });
  const placeholder = useMemo(
    () => ({
      selectedEventId: null,
      titleNow: '',
    }),
    [],
  );

  return data ?? placeholder;
};

export const useTimerProvider = () => {
  const { data } = useQuery(TIMER, () => undefined, {
    cacheTime: Infinity,
    staleTime: Infinity,
  });
  const placeholder = useMemo(
    () => ({
      clock: 0,
      current: null,
      secondaryTimer: null,
      duration: null,
      expectedFinish: null,
      startedAt: null,
    }),
    [],
  );
  return data ?? placeholder;
};

export const useEventProvider = (eventId) => {
  const socket = useSocket();

  const setPlayback = useMemo(() => ({
    loadEvent: () => socket.emit('set-loadid', eventId),
    startEvent: () => socket.emit('set-startid', eventId),
    pause: () => socket.emit('set-pause'),
  }), [socket]);

  return { setPlayback };
};

export const useSocketProvider = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.emit('get-ontime-feat-eventlist');
    socket.on('ontime-feat-rundown', (featureData) => {
      queryClient.setQueryData(FEAT_RUNDOWN, () => featureData);
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

    socket.emit('get-ontime-feat-cuesheet');
    socket.on('ontime-feat-cuesheet', (featureData) => {
      queryClient.setQueryData(FEAT_CUESHEET, () => featureData);
    });

    socket.emit('get-ontime-timer');
    socket.on('ontime-timer', (featureData) => {
      queryClient.setQueryData(TIMER, () => featureData);
    });

    return () => {
      socket.off('ontime-feat-rundown');
      socket.off('ontime-feat-messagecontrol');
      socket.off('ontime-feat-playbackcontrol');
      socket.off('ontime-feat-info');
      socket.off('ontime-feat-cuesheet');
      socket.off('ontime-timer');
    };
  }, [queryClient, socket]);
};
