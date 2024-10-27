import { version } from '../../../../../package.json';
import { getLatestVersion } from '../../common/api/external';

export type SettingsOption = {
  id: string;
  label: string;
  secondary?: Readonly<SettingsOption[]>;
  split?: boolean;
  attention?: string;
};

async function getHasUpdates(): Promise<string | undefined> {
  try {
    const latest = await getLatestVersion();
    if (!latest.version.includes(version)) {
      return 'New version available';
    }
  } catch {
    /* we dont handle errors*/
  }
  return;
}

export const settingPanels: Readonly<SettingsOption[]> = [
  {
    id: 'project',
    label: 'Project',
    secondary: [
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
    id: 'integrations',
    label: 'Integrations',
    secondary: [
      { id: 'integrations__osc', label: 'OSC settings' },
      { id: 'integrations__http', label: 'HTTP settings' },
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
    attention: await getHasUpdates(),
  },
  {
    id: 'shutdown',
    label: 'Shutdown',
    split: true,
  },
] as const;

export type SettingsOptionId = (typeof settingPanels)[number]['id'];

export interface PanelBaseProps {
  location?: string;
}
