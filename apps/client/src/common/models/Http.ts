import { HTTPSettings } from 'ontime-types';

export const httpPlaceholder: HTTPSettings = {
  enabledOut: false,
  subscriptions: {
    onLoad: [],
    onStart: [],
    onUpdate: [],
    onPause: [],
    onStop: [],
    onFinish: [],
  },
};
