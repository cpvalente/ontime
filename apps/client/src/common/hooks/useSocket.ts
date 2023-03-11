import { useMemo } from 'react';

import { useRuntimeStore } from '../stores/runtime';
import { socketSendJson } from '../utils/socket';

export const useRundownEditor = () => {
  const state = useRuntimeStore();

  return useMemo(() => {
    return {
      selectedEventId: state.loaded.selectedEventId,
      nextEventId: state.loaded.nextEventId,
      playback: state.playback,
    };
  }, [state.loaded.selectedEventId, state.loaded.nextEventId, state.playback]);
};

export const useMessageControl = () => {
  const state = useRuntimeStore();
  return useMemo(() => {
    return {
      timerMessage: state.timerMessage,
      publicMessage: state.publicMessage,
      lowerMessage: state.lowerMessage,
      onAir: state.onAir,
    };
  }, [state.timerMessage, state.publicMessage, state.lowerMessage, state.onAir]);
};

export const setMessage = {
  presenterText: (payload: string) => socketSendJson('set-timer-message-text', payload),
  presenterVisible: (payload: boolean) => socketSendJson('set-timer-message-visible', payload),
  publicText: (payload: string) => socketSendJson('set-public-message-text', payload),
  publicVisible: (payload: boolean) => socketSendJson('set-public-message-visible', payload),
  lowerText: (payload: string) => socketSendJson('set-lower-message-text', payload),
  lowerVisible: (payload: boolean) => socketSendJson('set-lower-message-visible', payload),
  onAir: (payload: boolean) => socketSendJson('set-onAir', payload),
};

export const usePlaybackControl = () => {
  const state = useRuntimeStore();

  return useMemo(() => {
    return {
      playback: state.playback,
      numEvents: state.loaded.numEvents,
    };
  }, [state.playback, state.loaded.numEvents]);
};

export const setPlayback = {
  start: () => socketSendJson('start'),
  pause: () => socketSendJson('pause'),
  roll: () => socketSendJson('roll'),
  previous: () => {
    socketSendJson('previous');
  },
  next: () => {
    socketSendJson('next');
  },
  stop: () => {
    socketSendJson('stop');
  },
  reload: () => {
    socketSendJson('reload');
  },
  delay: (amount: number) => {
    socketSendJson('delay', amount);
  },
};

export const useInfoPanel = () => {
  const state = useRuntimeStore();

  return useMemo(() => {
    return {
      titles: state.titles,
      playback: state.playback,
      selectedEventIndex: state.loaded.selectedEventIndex,
      numEvents: state.loaded.numEvents,
    };
  }, [state.titles, state.playback, state.loaded.selectedEventIndex, state.loaded.numEvents]);
};

export const useCuesheet = () => {
  const state = useRuntimeStore();

  return useMemo(() => {
    return {
      selectedEventIndex: state.loaded.selectedEventId,
      titleNow: state.titles.titleNow,
    };
  }, [state.loaded.selectedEventId, state.titles.titleNow]);
};

export const setEventPlayback = {
  loadEvent: (eventId: string) => socketSendJson('loadid', eventId),
  startEvent: (eventId: string) => socketSendJson('startid', eventId),
  pause: () => socketSendJson('pause'),
};

export const useTimer = () => {
  const state = useRuntimeStore();

  return useMemo(() => {
    return {
      timer: state.timer,
    };
  }, [state.timer]);
};
