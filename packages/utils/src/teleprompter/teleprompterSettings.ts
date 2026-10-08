import type { TeleprompterSettings } from 'ontime-types';

export const teleprompterCharsPerLine = {
  min: 10,
  max: 80,
} as const;

export const defaultTeleprompterSettings: Readonly<TeleprompterSettings> = {
  script: 'note',
  charsPerLine: 32,
  heading: 'title',
  showGroups: true,
  hideEmpty: true,
  followLoaded: true,
};
