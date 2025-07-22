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

type BaseURLPreset = {
  target: Omit<OntimeView, 'editor'>;
  enabled: boolean;
  alias: string;
  search: string;
  options?: Record<string, string>;
};

type CuesheetUrlPreset = {
  target: OntimeView.Cuesheet;
  enabled: boolean;
  alias: string;
  search: string;
  options: {
    readPermissions: string;
    writePermissions: string;
  };
};

export type URLPreset = BaseURLPreset | CuesheetUrlPreset;
