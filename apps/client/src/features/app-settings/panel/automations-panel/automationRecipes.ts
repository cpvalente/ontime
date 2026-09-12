import type { AutomationDTO, AutomationOutput, TimerLifeCycle } from 'ontime-types';
import { TimerLifeCycle as Cycle } from 'ontime-types';
import { parseUserTime } from 'ontime-utils';

export type RecipeCategory = 'ontime' | 'playback' | 'video' | 'messaging';

export const recipeCategoryLabels: Record<RecipeCategory, string> = {
  ontime: 'Ontime automations',
  playback: 'Playback and cue systems',
  video: 'Video and streaming',
  messaging: 'Webhooks and messaging',
};

export const recipeCategoryOrder: RecipeCategory[] = ['ontime', 'playback', 'video', 'messaging'];

export type RecipeParam = {
  name: string;
  label: string;
  hint?: string;
  type?: 'text' | 'number' | 'choice';
  options?: { value: string; label: string }[];
  wide?: boolean;
  defaultValue: string;
  validation?:
    | { kind: 'duration' }
    | { kind: 'host' }
    | { kind: 'url' }
    | { kind: 'integer'; min: number; max?: number };
};

export type RecipeValues = Record<string, string>;

export type AutomationRecipe = {
  id: string;
  title: string;
  description: string;
  category: RecipeCategory;
  localOnly?: boolean;
  keywords?: string[];
  params: RecipeParam[];
  triggers: TimerLifeCycle[];
  build: (values: RecipeValues) => AutomationDTO;
};

const auxTimers = [
  { value: '1', label: 'Aux timer 1' },
  { value: '2', label: 'Aux timer 2' },
  { value: '3', label: 'Aux timer 3' },
];

type AuxNumber = '1' | '2' | '3';

function toAux(value: string): AuxNumber {
  return value === '2' || value === '3' ? value : '1';
}

const auxSet = { 1: 'aux1-set', 2: 'aux2-set', 3: 'aux3-set' } as const;
const auxStart = { 1: 'aux1-start', 2: 'aux2-start', 3: 'aux3-start' } as const;
const auxStop = { 1: 'aux1-stop', 2: 'aux2-stop', 3: 'aux3-stop' } as const;
const auxSource = { 1: 'aux1', 2: 'aux2', 3: 'aux3' } as const;

function origin(value: string): string {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return value.trim();
  }
}

function withQuery(url: string, query: string): string {
  const trimmed = url.trim();
  const fragmentIndex = trimmed.indexOf('#');
  const base = fragmentIndex === -1 ? trimmed : trimmed.slice(0, fragmentIndex);
  const fragment = fragmentIndex === -1 ? '' : trimmed.slice(fragmentIndex);
  return `${base}${base.includes('?') ? '&' : '?'}${query}${fragment}`;
}

function buildUnfilteredAutomation(title: string, outputs: AutomationOutput[]): AutomationDTO {
  return { title, filterRule: 'all', filters: [], outputs };
}

export const automationRecipes: AutomationRecipe[] = [
  {
    id: 'ontime-aux-timer',
    title: 'Run an aux timer with the event',
    description: 'Sets an aux timer and starts it whenever an event starts.',
    category: 'ontime',
    keywords: ['countdown', 'stage timer', 'speaker'],
    params: [
      { name: 'aux', label: 'Which timer', type: 'choice', options: auxTimers, defaultValue: '1' },
      {
        name: 'duration',
        label: 'Duration',
        hint: 'hh:mm:ss',
        defaultValue: '00:05:00',
        validation: { kind: 'duration' },
      },
    ],
    triggers: [Cycle.onStart],
    build: ({ aux, duration }) =>
      buildUnfilteredAutomation(`Run Aux Timer ${toAux(aux)} with the event`, [
        { type: 'ontime', action: auxSet[toAux(aux)], time: duration.trim() },
        { type: 'ontime', action: auxStart[toAux(aux)] },
      ]),
  },
  {
    id: 'ontime-aux-stop',
    title: 'Stop the aux timer when the event ends',
    description: 'Stops an aux timer on finish, so it does not keep running into the next event.',
    category: 'ontime',
    keywords: ['countdown', 'stage timer', 'reset'],
    params: [{ name: 'aux', label: 'Which timer', type: 'choice', options: auxTimers, defaultValue: '1' }],
    triggers: [Cycle.onFinish],
    build: ({ aux }) =>
      buildUnfilteredAutomation(`Stop Aux Timer ${toAux(aux)} on finish`, [
        { type: 'ontime', action: auxStop[toAux(aux)] },
      ]),
  },
  {
    id: 'ontime-warn-stage',
    title: 'Warn the stage when time runs low',
    description: 'Shows a message on the stage timer as the running event enters its danger window.',
    category: 'ontime',
    keywords: ['message', 'danger', 'wrap up', 'presenter'],
    params: [{ name: 'message', label: 'Message', wide: true, defaultValue: 'Please wrap up' }],
    triggers: [Cycle.onDanger],
    build: ({ message }) =>
      buildUnfilteredAutomation('Warn the stage at danger', [
        { type: 'ontime', action: 'message-set', text: message, visible: true },
      ]),
  },
  {
    id: 'ontime-clear-message',
    title: 'Hide the stage message on finish',
    description: 'Clears the stage message once the event finishes. Pairs with the warning above.',
    category: 'ontime',
    keywords: ['message', 'clear', 'presenter'],
    params: [],
    triggers: [Cycle.onFinish],
    build: () =>
      buildUnfilteredAutomation('Hide the stage message on finish', [
        { type: 'ontime', action: 'message-set', text: '', visible: false },
      ]),
  },
  {
    id: 'ontime-secondary-message',
    title: 'Show an aux timer beside the stage message',
    description: 'Points the secondary field on the stage timer at an aux timer when an event loads.',
    category: 'ontime',
    keywords: ['message', 'secondary', 'stage', 'countdown'],
    params: [{ name: 'aux', label: 'Which timer', type: 'choice', options: auxTimers, defaultValue: '1' }],
    triggers: [Cycle.onLoad],
    build: ({ aux }) =>
      buildUnfilteredAutomation(`Show Aux Timer ${toAux(aux)} as the secondary message`, [
        { type: 'ontime', action: 'message-secondary', secondarySource: auxSource[toAux(aux)] },
      ]),
  },
  {
    id: 'qlab-go',
    title: 'QLab — fire the matching cue',
    description: "Starts the QLab cue whose number matches the Ontime event's cue.",
    category: 'playback',
    localOnly: true,
    keywords: ['osc', 'sound', 'audio', 'mac', 'figure 53'],
    params: [
      {
        name: 'ip',
        label: 'QLab computer',
        hint: 'IP address of the machine running QLab',
        wide: true,
        defaultValue: '127.0.0.1',
        validation: { kind: 'host' },
      },
      {
        name: 'port',
        label: 'OSC port',
        type: 'number',
        hint: "QLab's default is 53000",
        defaultValue: '53000',
        validation: { kind: 'integer', min: 1024, max: 65535 },
      },
    ],
    triggers: [Cycle.onStart],
    build: ({ ip, port }) =>
      buildUnfilteredAutomation('QLab GO on event start', [
        {
          type: 'osc',
          targetIP: ip.trim(),
          targetPort: Number(port),
          address: '/cue/{{eventNow.cue}}/start',
          args: '',
        },
      ]),
  },
  {
    id: 'companion-press',
    title: 'Companion — press a button',
    description: 'Presses a Stream Deck button through the Companion HTTP API when an event starts.',
    category: 'playback',
    localOnly: true,
    keywords: ['stream deck', 'bitfocus', 'obs', 'http', 'elgato'],
    params: [
      {
        name: 'host',
        label: 'Companion address',
        hint: 'Where the Companion HTTP API is listening',
        wide: true,
        defaultValue: 'http://127.0.0.1:8888',
        validation: { kind: 'url' },
      },
      { name: 'page', label: 'Page', type: 'number', defaultValue: '1', validation: { kind: 'integer', min: 1 } },
      { name: 'row', label: 'Row', type: 'number', defaultValue: '0', validation: { kind: 'integer', min: 0 } },
      { name: 'column', label: 'Column', type: 'number', defaultValue: '0', validation: { kind: 'integer', min: 0 } },
    ],
    triggers: [Cycle.onStart],
    build: ({ host, page, row, column }) =>
      buildUnfilteredAutomation('Companion button press', [
        { type: 'http', url: `${origin(host)}/api/location/${page}/${row}/${column}/press` },
      ]),
  },
  {
    id: 'vmix-overlay-warning',
    title: 'vMix — show an overlay on warning',
    description: 'Triggers a vMix overlay through the web controller when the timer enters its warning window.',
    category: 'video',
    localOnly: true,
    keywords: ['streaming', 'http', 'lower third', 'graphics'],
    params: [
      {
        name: 'host',
        label: 'vMix address',
        hint: 'The vMix web controller',
        wide: true,
        defaultValue: 'http://127.0.0.1:8088',
        validation: { kind: 'url' },
      },
      {
        name: 'overlay',
        label: 'Overlay number',
        type: 'number',
        defaultValue: '1',
        validation: { kind: 'integer', min: 1, max: 4 },
      },
    ],
    triggers: [Cycle.onWarning],
    build: ({ host, overlay }) =>
      buildUnfilteredAutomation('vMix overlay on warning', [
        { type: 'http', url: `${origin(host)}/api/?Function=OverlayInput${overlay}In` },
      ]),
  },
  {
    id: 'webhook-event-title',
    title: 'Webhook — send the running event title',
    description: 'Calls any URL with the running event title, as a template string you can edit afterwards.',
    category: 'messaging',
    keywords: ['http', 'rest', 'api', 'integration', 'slack'],
    params: [
      {
        name: 'url',
        label: 'URL',
        hint: 'The event title is added as a title parameter',
        wide: true,
        defaultValue: 'http://127.0.0.1:3000/now',
        validation: { kind: 'url' },
      },
    ],
    triggers: [Cycle.onStart],
    build: ({ url }) =>
      buildUnfilteredAutomation('Webhook with the current event', [
        { type: 'http', url: withQuery(url, 'title={{url:eventNow.title}}') },
      ]),
  },
];

export function defaultValues(recipe: AutomationRecipe): RecipeValues {
  return Object.fromEntries(recipe.params.map(({ name, defaultValue }) => [name, defaultValue]));
}

export function getAvailableRecipes(isCloud: boolean): AutomationRecipe[] {
  return isCloud ? automationRecipes.filter((recipe) => !recipe.localOnly) : automationRecipes;
}

export function validateRecipeValues(recipe: AutomationRecipe, values: RecipeValues): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const param of recipe.params) {
    const value = values[param.name]?.trim() ?? '';
    if (!value) {
      errors[param.name] = 'Required field';
      continue;
    }

    if (param.validation?.kind === 'url' && !isHttpUrl(value)) {
      errors[param.name] = 'Enter a URL starting with http:// or https://';
    } else if (param.validation?.kind === 'duration' && !isDuration(value)) {
      errors[param.name] = 'Enter a valid duration';
    } else if (param.validation?.kind === 'host' && !isHost(value)) {
      errors[param.name] = 'Enter an IP address or hostname';
    } else if (param.validation?.kind === 'integer') {
      const number = Number(value);
      const { min, max } = param.validation;
      if (!Number.isInteger(number) || number < min || (max !== undefined && number > max)) {
        errors[param.name] =
          max === undefined ? `Enter a whole number of ${min} or more` : `Enter a whole number from ${min} to ${max}`;
      }
    }
  }

  return errors;
}

function isDuration(value: string): boolean {
  return /^\d+(?::\d{1,2}){0,2}$/.test(value) && (parseUserTime(value) > 0 || /^0+(?::0+){0,2}$/.test(value));
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isHost(value: string): boolean {
  if (value === 'localhost') {
    return true;
  }

  const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;
  const hostname = /^(?=.{1,253}$)[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)*$/i;
  if (ipv4.test(value) || hostname.test(value)) {
    return true;
  }

  return false;
}
