import { HttpSettings } from 'ontime-types';

export const httpPlaceholder: HttpSettings = {
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
