import { TimerLifeCycleKey } from '../services/integration-service/IIntegration.js';

export type OscSubscriptions = { [key in TimerLifeCycleKey]?: { message: string; enabled: boolean } };

export interface OscConfig {
  port: number;
  portOut: number;
  targetIP: string;
  enabled: boolean;
  subscriptions: OscSubscriptions;
}
