import { useMemo } from 'react';

import useAppVersion from '../../common/hooks-query/useAppVersion';
import { isDocker } from '../../externals';

type SettingsOptionBase = {
  id: string;
  label: string;
  highlight?: string;
};

export type SettingsOption =
  | (SettingsOptionBase & { secondary: Readonly<SettingsOption[]>; keywords?: never })
  | (SettingsOptionBase & { secondary?: never; keywords: Readonly<string[]> });

const staticOptions = [
  {
    id: 'settings',
    label: 'Settings',
    secondary: [
      { id: 'settings__data', label: 'Project data', keywords: ['title', 'description', 'logo', 'url', 'info'] },
      {
        id: 'settings__general',
        label: 'General settings',
        keywords: ['pin', 'password', 'lock', 'language', 'time format', 'timezone'],
      },
      {
        id: 'settings__view',
        label: 'View settings',
        keywords: ['css', 'style', 'theme', 'translation', 'freeze', 'overtime'],
      },
      { id: 'settings__custom-views', label: 'Custom views', keywords: ['html', 'upload', 'external', 'embed'] },
      { id: 'settings__mcp', label: 'MCP Server', keywords: ['ai', 'agent', 'model'] },
      ...(isDocker ? [] : [{ id: 'settings__port', label: 'Server port', keywords: ['http', 'network', 'address'] }]),
    ],
  },
  {
    id: 'project',
    label: 'Project',
    secondary: [
      { id: 'project__create', label: 'Create...', keywords: ['new project', 'quick start', 'wizard'] },
      {
        id: 'project__list',
        label: 'Manage projects',
        keywords: ['load', 'open', 'rename', 'duplicate', 'delete', 'download', 'import', 'backup', 'merge'],
      },
    ],
  },
  {
    id: 'manage',
    label: 'Project settings',
    secondary: [
      {
        id: 'manage__defaults',
        label: 'Rundown defaults',
        keywords: ['duration', 'warning', 'danger', 'defaults'],
      },
      {
        id: 'manage__custom',
        label: 'Custom fields',
        keywords: ['metadata', 'columns', 'extra data', 'image field'],
      },
      {
        id: 'manage__rundowns',
        label: 'Manage rundowns',
        keywords: ['rundown', 'xlsx', 'excel', 'load', 'export'],
      },
      {
        id: 'manage__sheets',
        label: 'Import spreadsheet',
        keywords: ['google sheet', 'sync', 'spreadsheet', 'xlsx', 'excel', 'csv', 'export'],
      },
    ],
  },
  {
    id: 'automation',
    label: 'Automation',
    secondary: [
      {
        id: 'automation__settings',
        label: 'Automation settings',
        keywords: ['osc input', 'port', 'enable', 'remote control'],
      },
      {
        id: 'automation__automations',
        label: 'Manage automations',
        keywords: ['osc', 'http', 'webhook', 'integration', 'api', 'output', 'action'],
      },
      {
        id: 'automation__triggers',
        label: 'Manage triggers',
        keywords: ['lifecycle', 'on load', 'on start', 'on finish', 'on update'],
      },
    ],
  },
  {
    id: 'sharing',
    label: 'Sharing and reporting',
    secondary: [
      { id: 'sharing__presets', label: 'URL Presets', keywords: ['alias', 'link', 'url', 'shortcut'] },
      {
        id: 'sharing__link',
        label: 'Share link',
        keywords: ['qr code', 'guest', 'cuesheet link', 'permissions', 'read only'],
      },
      { id: 'sharing__report', label: 'Runtime report', keywords: ['actual times', 'csv', 'export', 'history'] },
    ],
  },
  {
    id: 'network',
    label: 'Network',
    secondary: [
      {
        id: 'network__log',
        label: 'Event log',
        keywords: ['debug', 'errors', 'console', 'export log'],
      },
      {
        id: 'network__clients',
        label: 'Manage clients',
        keywords: ['redirect', 'identify', 'rename client', 'connected'],
      },
    ],
  },
  {
    id: 'about',
    label: 'About',
    keywords: ['version', 'update', 'licence', 'license', 'credits'],
  },
  {
    id: 'shutdown',
    label: 'Shutdown',
    keywords: ['quit', 'exit', 'close ontime'],
  },
] as const;

// a child of navigation or a child of secondary navigation
export type SettingsOptionId =
  | (typeof staticOptions)[number]['id']
  | Extract<(typeof staticOptions)[number], { secondary: object }>['secondary'][number]['id'];

function sanitiseSearchInput(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesSettingsOptionQuery(option: SettingsOption, query: string): boolean {
  const sanitisedQuery = sanitiseSearchInput(query);
  if (!sanitisedQuery) {
    return false;
  }

  const sanitisedLabel = sanitiseSearchInput(option.label);
  if (sanitisedLabel.includes(sanitisedQuery)) {
    return true;
  }

  // check keywords
  return Boolean(option.keywords?.some((keyword) => keyword.includes(sanitisedQuery)));
}

/**
 * Filters the settings menu against a user query.
 * A group is kept if it matches itself (with all its children) or if any of its children match.
 */
export function filterSettingsOptions(options: Readonly<SettingsOption[]>, query: string): SettingsOption[] {
  const sanitisedQuery = sanitiseSearchInput(query);
  if (!sanitisedQuery) {
    return [...options];
  }

  return options.reduce<SettingsOption[]>((accumulator, option) => {
    if (matchesSettingsOptionQuery(option, sanitisedQuery)) {
      accumulator.push(option);
      return accumulator;
    }

    if (option.secondary) {
      const secondary = option.secondary.filter((child) => matchesSettingsOptionQuery(child, sanitisedQuery));
      if (secondary.length) {
        accumulator.push({ ...option, secondary });
      }
    }
    return accumulator;
  }, []);
}

export function useAppSettingsMenu() {
  const { data } = useAppVersion();

  const options: Readonly<SettingsOption[]> = useMemo(
    () =>
      staticOptions.map((option) =>
        // if there is an update then highlight the about setting
        option.id === 'about' && data.hasUpdates
          ? Object.assign({}, option, { highlight: 'New version available' })
          : option,
      ),
    [data],
  );

  return { options };
}
