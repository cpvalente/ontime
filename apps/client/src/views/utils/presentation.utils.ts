import { ViewSettings } from 'ontime-types';

/**
 * Which colour should the timer have at a given moment
 */
export function getTimerColour(viewSettings: ViewSettings, showWarning: boolean, showDanger: boolean) {
  if (showWarning) return viewSettings.warningColor;
  if (showDanger) return viewSettings.dangerColor;
  return viewSettings.normalColor;
}
