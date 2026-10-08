import { ViewSettings } from 'ontime-types';
import { defaultTeleprompterSettings } from 'ontime-utils';

export const viewsSettingsPlaceholder: ViewSettings = {
  dangerColor: '#ff7300',
  normalColor: '#ffffffcc',
  overrideStyles: false,
  warningColor: '#ffa528',
  teleprompter: { ...defaultTeleprompterSettings },
};
