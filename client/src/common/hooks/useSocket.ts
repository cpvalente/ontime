import { useQuery } from '@tanstack/react-query';
import { ontimeQueryClient as queryClient } from 'common/queryClient';
import socket, { subscribeOnce } from 'common/utils/socket';

import {
  FEAT_CUESHEET,
  FEAT_INFO,
  FEAT_MESSAGECONTROL,
  FEAT_PLAYBACKCONTROL,
  FEAT_RUNDOWN,
  TIMER,
} from '../api/apiConstants';

function createSocketHook<T>(key: string, defaultValue: T | null = null) {
  subscribeOnce<T>(key, (data) => queryClient.setQueryData([key], data));

  // retrieves data from the cache or null if non-existent
  // we need the null because useQuery can't receive undefined
  const fetcher = () => (queryClient.getQueryData([key]) ?? defaultValue) as T | null;

  return () => useQuery({ queryKey: [key], queryFn: fetcher, placeholderData: defaultValue });
}

const emptyRundown = {
  selectEventId: null,
  nextEventId: null,
  playback: null,
};

export const useRundownEditor = createSocketHook(FEAT_RUNDOWN, emptyRundown);

const emptyMessageControl = {
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

export const useMessageControl = createSocketHook(FEAT_MESSAGECONTROL, emptyMessageControl);
export const setMessage = {
  presenterText: (payload: string) => socket.emit('set-timer-message-text', payload),
  presenterVisible: (payload: boolean) => socket.emit('set-timer-message-visible', payload),
  publicText: (payload: string) => socket.emit('set-public-message-text', payload),
  publicVisible: (payload: boolean) => socket.emit('set-public-message-visible', payload),
  lowerText: (payload: string) => socket.emit('set-lower-message-text', payload),
  lowerVisible: (payload: boolean) => socket.emit('set-lower-message-visible', payload),
  onAir: (payload: boolean) => socket.emit('set-onAir', payload),
};

export const emptyPlaybackControl = {
  playback: 'stop',
  selectedEventId: null,
  numEvents: 0,
};
export const usePlaybackControl = createSocketHook(FEAT_PLAYBACKCONTROL, emptyPlaybackControl);
export const resetPlayback = () => {
  const cacheData = queryClient.getQueryData([FEAT_PLAYBACKCONTROL]) as Record<string, unknown>;
  queryClient.setQueryData([FEAT_PLAYBACKCONTROL], {
    ...cacheData,
    playback: 'stop',
    selectedEventId: null,
  });
};
export const setPlayback = {
  start: () => socket.emit('set-start'),
  pause: () => socket.emit('set-pause'),
  roll: () => socket.emit('set-roll'),
  previous: () => {
    socket.emit('set-previous');
  },
  next: () => {
    socket.emit('set-next');
  },
  stop: () => {
    socket.emit('set-stop');
  },
  reload: () => {
    socket.emit('set-reload');
  },
  delay: (amount: number) => {
    socket.emit('set-delay', amount);
  },
};

export const emptyInfo = {
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

export const useInfoPanel = createSocketHook(FEAT_INFO, emptyInfo);

export const emptyCuesheet = {
  selectedEventId: null,
  titleNow: '',
};

export const useCuesheet = createSocketHook(FEAT_CUESHEET, emptyCuesheet);


export const setEventPlayback = {
  loadEvent: (eventId: string) => socket.emit('set-loadid', eventId),
  startEvent: (eventId: string) => socket.emit('set-startid', eventId),
  pause: () => socket.emit('set-pause'),
};

const emptyTimer = {
  clock: 0,
  current: 0,
  secondaryTimer: null,
  duration: null,
  startedAt: null,
  expectedFinish: null,
};

export const useTimer = createSocketHook(TIMER, emptyTimer);
