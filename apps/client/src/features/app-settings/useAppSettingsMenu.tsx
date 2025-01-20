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
    id: 'project',
    label: 'Project',
    secondary: [
      { id: 'project__create', label: 'Create...' },
      { id: 'project__data', label: 'Project data' },
      { id: 'project__manage', label: 'Manage projects' },
    ],
  },
  {
    id: 'general',
    label: 'App Settings',
    secondary: [
      { id: 'general__settings', label: 'General settings' },
      { id: 'general__editor', label: 'Editor settings' },
      { id: 'general__view', label: 'View settings' },
    ],
  },
  {
    id: 'feature_settings',
    label: 'Feature Settings',
    secondary: [
      { id: 'feature_settings__custom', label: 'Custom fields' },
      { id: 'feature_settings__urlpresets', label: 'URL Presets' },
    ],
  },
  {
    id: 'sources',
    label: 'Data Sources',
    secondary: [
      { id: 'sources__xlsx', label: 'Import spreadsheet' },
      { id: 'sources__gsheet', label: 'Sync with Google Sheet' },
    ],
    split: true,
  },
  {
    id: 'automation',
    label: 'Automation',
    secondary: [
      { id: 'automation__settings', label: 'Automation settings' },
      { id: 'automation__triggers', label: 'Manage triggers' },
      { id: 'automation__automations', label: 'Manage automations' },
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
