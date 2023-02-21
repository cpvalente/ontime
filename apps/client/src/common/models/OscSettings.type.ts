export interface OSCSettings {
  portIn: number;
  portOut: number;
  targetIP: string;
  enabledIn: boolean;
  enabledOut: boolean;
  subscriptions: any;
}

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
  subscriptions: {},
};
