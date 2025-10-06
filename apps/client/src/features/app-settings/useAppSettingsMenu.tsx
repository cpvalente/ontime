import { useMemo } from 'react';

import useAppVersion from '../../common/hooks-query/useAppVersion';

export type SettingsOption = {
  id: string;
  label: string;
  secondary?: Readonly<SettingsOption[]>;
  split?: boolean;
  highlight?: string;
};

const staticOptions = [
  {
    id: 'settings',
    label: 'Settings',
    secondary: [
      { id: 'settings__data', label: 'Project data' },
      { id: 'settings__general', label: 'General settings' },
      { id: 'settings__view', label: 'View settings' },
    ],
  },
  {
    id: 'project',
    label: 'Project',
    split: true,
    secondary: [
      { id: 'project__create', label: 'Create...' },
      { id: 'project__list', label: 'Manage projects' },
    ],
  },
  {
    id: 'manage',
    label: 'Project settings',
    secondary: [
      { id: 'manage__defaults', label: 'Rundown defaults' },
      { id: 'manage__custom', label: 'Custom fields' },
      { id: 'manage__rundowns', label: 'Manage rundowns' },
      { id: 'manage__sheets', label: 'Import spreadsheet' },
      { id: 'manage__sheets', label: 'Sync with Google Sheet' },
    ],
  },
  {
    id: 'automation',
    label: 'Automation',
    split: true,
    secondary: [
      { id: 'automation__settings', label: 'Automation settings' },
      { id: 'automation__automations', label: 'Manage automations' },
      { id: 'automation__triggers', label: 'Manage triggers' },
    ],
  },
  {
    id: 'sharing',
    label: 'Sharing and reporting',
    split: true,
    secondary: [
      { id: 'sharing__presets', label: 'URL Presets' },
      {
        id: 'sharing__link',
        label: 'Share link',
      },
      { id: 'sharing__report', label: 'Runtime report' },
    ],
  },
  {
    id: 'network',
    label: 'Network',
    split: true,
    secondary: [
      {
        id: 'network__log',
        label: 'Event log',
      },
      {
        id: 'network__clients',
        label: 'Manage clients',
      },
    ],
  },
  {
    id: 'about',
    label: 'About',
    split: true,
  },
  {
    id: 'shutdown',
    label: 'Shutdown',
    split: true,
  },
] as const;

export type SettingsOptionId = (typeof staticOptions)[number]['id'];

export function useAppSettingsMenu() {
  const { data } = useAppVersion();

  const options: Readonly<SettingsOption[]> = useMemo(
    () =>
      staticOptions.map((option) => ({
        ...option,
        highlight: option.id === 'about' && data.hasUpdates ? 'New version available' : undefined,
      })),
    [data],
  );

  return { options };
}
