import { HttpSettings } from 'ontime-types';

export const httpPlaceholder: HttpSettings = {
  enabledOut: false,
  retryCount: 0,
  subscriptions: {
    onLoad: [],
    onStart: [],
    onUpdate: [],
    onPause: [],
    onStop: [],
    onFinish: [],
  },
};
