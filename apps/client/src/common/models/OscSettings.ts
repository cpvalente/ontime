import { OSCSettings } from 'ontime-types';

// in the placeholder, we pass strings to satisfy input type
export interface PlaceholderSettings extends Omit<OSCSettings, 'portIn' | 'portOut'> {
  portIn: string;
  portOut: string;
}

export const oscPlaceholderSettings: PlaceholderSettings = {
  portIn: '',
  portOut: '',
  targetIP: '',
  enabledIn: false,
  enabledOut: false,
  subscriptions: {
    onLoad: [],
    onStart: [],
    onPause: [],
    onStop: [],
    onUpdate: [],
    onFinish: [],
  },
};
