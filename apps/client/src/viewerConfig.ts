import { OntimeView } from 'ontime-types';

/** User facing name of each view, the single source for view naming in the UI */
export const viewLabels: Record<OntimeView, string> = {
  [OntimeView.Editor]: 'Editor',
  [OntimeView.Cuesheet]: 'Cuesheet',
  [OntimeView.Operator]: 'Operator',
  [OntimeView.Timer]: 'Timer',
  [OntimeView.Backstage]: 'Backstage',
  [OntimeView.Timeline]: 'Timeline',
  [OntimeView.StudioClock]: 'Studio Clock',
  [OntimeView.Countdown]: 'Countdown',
  [OntimeView.Teleprompter]: 'Teleprompter',
  [OntimeView.ProjectInfo]: 'Project Info',
};

/** Views offered in the navigation menu, in the order they are shown. Their value is also their route */
const navigatorViews = [
  OntimeView.Timer,
  OntimeView.Backstage,
  OntimeView.Timeline,
  OntimeView.StudioClock,
  OntimeView.Countdown,
  OntimeView.Teleprompter,
  OntimeView.ProjectInfo,
];

export const navigatorConstants = navigatorViews.map((view) => ({ url: view, label: viewLabels[view] }));

// default time format to use for users in 12 hour clocks
export const FORMAT_12 = 'h:mm:ss a';
// default time format to use for users in 24 hour clocks
export const FORMAT_24 = 'HH:mm:ss';
