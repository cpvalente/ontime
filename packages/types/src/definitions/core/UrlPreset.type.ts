/**
 * Describes all views in Ontime
 */
export enum OntimeView {
  Editor = 'editor',
  Cuesheet = 'cuesheet',
  Operator = 'op',
  Timer = 'timer',
  Backstage = 'backstage',
  Timeline = 'timeline',
  StudioClock = 'studio',
  Countdown = 'countdown',
  ProjectInfo = 'info',
}

export type URLPreset = {
  // presets cannot target the editor view
  target: Omit<OntimeView, 'editor'>;
  enabled: boolean;
  alias: string;
  search: string;
};
