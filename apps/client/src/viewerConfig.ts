import { OntimeView } from 'ontime-types';

/** Human readable labels for the Ontime views */
export const viewLabels: Record<OntimeView, string> = {
  [OntimeView.Editor]: 'Editor',
  [OntimeView.Cuesheet]: 'Cuesheet',
  [OntimeView.Operator]: 'Operator',
  [OntimeView.Timer]: 'Timer',
  [OntimeView.Backstage]: 'Backstage',
  [OntimeView.Timeline]: 'Timeline',
  [OntimeView.StudioClock]: 'Studio Clock',
  [OntimeView.Countdown]: 'Countdown',
  [OntimeView.ProjectInfo]: 'Project Info',
};

export const navigatorConstants = [
  { url: 'timer', label: 'Timer' },
  { url: 'backstage', label: 'Backstage' },
  { url: 'timeline', label: 'Timeline' },
  { url: 'studio', label: 'Studio Clock' },
  { url: 'countdown', label: 'Countdown' },
  { url: 'info', label: 'Project Info' },
];

// default time format to use for users in 12 hour clocks
export const FORMAT_12 = 'h:mm:ss a';
// default time format to use for users in 24 hour clocks
export const FORMAT_24 = 'HH:mm:ss';
