import { useMemo } from 'react';

import useAppVersion from '../../common/hooks-query/useAppVersion';
import { capabilities } from '../../externals';

type SettingsOptionBase = {
  id: string;
  label: string;
  highlight?: string;
};

export type SettingsOption =
  | (SettingsOptionBase & { secondary: Readonly<SettingsOption[]>; keywords?: never })
  | (SettingsOptionBase & { secondary?: never; keywords: Readonly<string[]> });

export const staticOptions = [
  {
    id: 'project',
    label: 'Project',
    secondary: [
      {
        id: 'project__data',
        label: 'Project data',
        keywords: ['title', 'description', 'logo', 'url', 'info', 'name', 'show name', 'rename show'],
      },
      {
        id: 'project__list',
        label: 'Projects',
        keywords: [
          'manage projects',
          'load',
          'open',
          'rename',
          'duplicate',
          'delete',
          'download',
          'import',
          'backup',
          'merge',
          'new project',
          'quick start',
        ],
      },
    ],
  },
  {
    id: 'rundown',
    label: 'Rundown',
    secondary: [
      {
        id: 'rundown__rundowns',
        label: 'Rundowns',
        keywords: ['manage rundowns', 'new rundown', 'rename', 'duplicate', 'delete', 'switch', 'load', 'export'],
      },
      {
        id: 'rundown__sheets',
        label: 'Import spreadsheet',
        keywords: ['import', 'google sheet', 'sync', 'spreadsheet', 'xlsx', 'excel', 'csv'],
      },
      {
        id: 'rundown__custom',
        label: 'Custom fields',
        keywords: ['metadata', 'column', 'cuesheet', 'extra data', 'image', 'option', 'dropdown', 'key', 'reorder'],
      },
      {
        id: 'rundown__defaults',
        label: 'Rundown defaults',
        keywords: [
          'defaults',
          'new event',
          'duration',
          'timer type',
          'end action',
          'link',
          'colour',
          'color',
          'warning time',
          'danger time',
        ],
      },
      { id: 'rundown__aux-timers', label: 'Aux timers', keywords: ['aux', 'auxiliary', 'timer', 'name', 'rename'] },
      {
        id: 'rundown__report',
        label: 'Runtime report',
        keywords: ['actual times', 'csv', 'export', 'history'],
      },
    ],
  },
  {
    id: 'views',
    label: 'Views',
    secondary: [
      {
        id: 'views__view',
        label: 'View settings',
        keywords: [
          'language',
          'translation',
          'custom translation',
          'time format',
          '12 hour',
          '24 hour',
          'css',
          'style',
          'stylesheet',
          'theme',
        ],
      },
      { id: 'views__custom-views', label: 'Custom views', keywords: ['html', 'upload', 'external', 'embed'] },
      {
        id: 'views__teleprompter',
        label: 'Teleprompter',
        keywords: ['prompter', 'script', 'autocue', 'line length', 'heading'],
      },
    ],
  },
  {
    id: 'sharing',
    label: 'Sharing and access',
    secondary: [
      { id: 'sharing__presets', label: 'URL presets', keywords: ['alias', 'link', 'url', 'shortcut'] },
      {
        id: 'sharing__link',
        label: 'Share',
        keywords: ['share link', 'qr code', 'guest', 'cuesheet link', 'permissions', 'read only', 'ip'],
      },
      {
        id: 'sharing__access',
        label: 'Access',
        keywords: ['pin', 'editor pin', 'operator pin', 'password', 'security', 'lock'],
      },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    secondary: [
      {
        id: 'integrations__automations',
        label: 'Automations',
        keywords: [
          'manage automations',
          'automation settings',
          'global triggers',
          'osc input',
          'osc',
          'port',
          'enable',
          'remote control',
          'api',
          'http',
          'webhook',
          'output',
          'action',
          'companion',
          'stream deck',
          'lighting',
          'qlab',
          'triggers',
          'lifecycle',
          'on load',
          'on start',
          'on finish',
          'on update',
        ],
      },
      {
        id: 'integrations__mcp',
        label: 'MCP server',
        keywords: ['ai', 'agent', 'model', 'llm'],
      },
    ],
  },
  {
    id: 'server',
    label: 'Server',
    secondary: [
      {
        id: 'server__clients',
        label: 'Clients',
        keywords: [
          'manage clients',
          'redirect',
          'identify',
          'rename client',
          'connected',
          'screen',
          'device',
          ...(capabilities.canChangePort ? ['server port', 'network', 'address'] : []),
        ],
      },
      {
        id: 'server__log',
        label: 'Event log',
        keywords: ['debug', 'errors', 'console', 'export log', 'log'],
      },
      { id: 'server__shutdown', label: 'Shutdown', keywords: ['quit', 'exit', 'stop', 'close ontime'] },
    ],
  },
  {
    id: 'about',
    label: 'About',
    keywords: ['version', 'update', 'licence', 'license', 'docs', 'help', 'support', 'discord', 'github'],
  },
] as const;

// a child of navigation or a child of secondary navigation
// project__create is not listed: it opens the quick start from the New button and the welcome modal
export type SettingsOptionId =
  | 'project__create'
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
