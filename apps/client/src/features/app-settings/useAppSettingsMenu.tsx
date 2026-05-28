import { useMemo } from 'react';

import useAppVersion from '../../common/hooks-query/useAppVersion';
import { isDocker } from '../../externals';

export type SettingsOption = {
  id: string;
  label: string;
  secondary?: Readonly<SettingsOption[]>;
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
      { id: 'settings__custom-views', label: 'Custom views' },
      { id: 'settings__port', label: 'Server port' },
    ],
  },
  {
    id: 'project',
    label: 'Project',
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
    secondary: [
      { id: 'automation__settings', label: 'Automation settings' },
      { id: 'automation__automations', label: 'Manage automations' },
      { id: 'automation__triggers', label: 'Manage triggers' },
    ],
  },
  {
    id: 'sharing',
    label: 'Sharing and reporting',
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
  },
  {
    id: 'shutdown',
    label: 'Shutdown',
  },
] as const;

export function getPanelLabel(panel: string, location?: string): { panelLabel: string; sectionLabel?: string } {
  const panelOption = staticOptions.find((o) => o.id === panel);
  if (!panelOption) return { panelLabel: panel };
  const panelLabel = panelOption.label;
  if (!location || !('secondary' in panelOption)) return { panelLabel };
  const match = panelOption.secondary.find((s) => s.id.split('__')[1] === location);
  return { panelLabel, sectionLabel: match?.label };
}

// a child of navigation or a child of secondary navigation
export type SettingsOptionId =
  | (typeof staticOptions)[number]['id']
  | Extract<(typeof staticOptions)[number], { secondary: object }>['secondary'][number]['id'];

export function useAppSettingsMenu() {
  const { data } = useAppVersion();

  const options: Readonly<SettingsOption[]> = useMemo(
    () =>
      staticOptions.map((option) => ({
        ...option,
        // if we are in docker don't show the port option
        secondary:
          'secondary' in option
            ? isDocker && option.id === 'settings'
              ? [...option.secondary.filter(({ id }) => id !== 'settings__port')]
              : [...option.secondary]
            : undefined,
        // if there is an update then highlight the about setting
        highlight: option.id === 'about' && data.hasUpdates ? 'New version available' : undefined,
      })),
    [data],
  );

  return { options };
}
