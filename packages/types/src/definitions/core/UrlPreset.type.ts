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

export type OntimeViewPresettable = Exclude<OntimeView, OntimeView.Editor>;

type BaseURLPreset = {
  target: OntimeViewPresettable;
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
