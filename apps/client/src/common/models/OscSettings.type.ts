export type OscSettingsType = {
  port: string;
  portOut: string;
  targetIP: string;
  enabled: boolean;
}

export const oscPlaceholderSettings: OscSettingsType = {
  port: '',
  portOut: '',
  targetIP: '',
  enabled: false,
};
