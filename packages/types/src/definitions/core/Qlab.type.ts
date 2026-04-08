import { TimerPhase } from '../runtime/TimerState.type.js';

export type QlabState = {
  enabled: boolean;
  connected: boolean;
  cueName: string;
  cueNumber: string;
  duration: number; // milliseconds
  elapsed: number; // milliseconds
  remaining: number; // milliseconds
  isPaused: boolean;
  phase: TimerPhase;
};

export type QlabSettings = {
  enabled: boolean;
  host: string;
  port: number; // default 53000
  listenPort: number; // default 53001
  filterByColor: string | null;
  filterByType: string | null;
  filterByCueNumber: string | null;
  warningThreshold: number; // milliseconds, default 30000
  dangerThreshold: number; // milliseconds, default 10000
  timeout: number; // milliseconds, default 3000
};
