import type { TeleprompterSettings } from './Teleprompter.type.js';

export type ViewSettings = {
  dangerColor: string;
  normalColor: string;
  overrideStyles: boolean;
  warningColor: string;
  teleprompter: TeleprompterSettings;
};
