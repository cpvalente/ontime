import type { AutomationDTO, TimerLifeCycle } from 'ontime-types';
import { TimerLifeCycle as Cycle } from 'ontime-types';

export type RecipeCategory = 'ontime' | 'playback' | 'video' | 'messaging';

export const recipeCategoryLabels: Record<RecipeCategory, string> = {
  ontime: 'Works out of the box',
  playback: 'Playback and cue systems',
  video: 'Video and streaming',
  messaging: 'Webhooks and messaging',
};

/** presentation order, empty categories are not rendered */
export const recipeCategoryOrder: RecipeCategory[] = ['ontime', 'playback', 'video', 'messaging'];

export type RecipeParam = {
  name: string;
  label: string;
  /** one line under the field, for anything the label cannot say */
  hint?: string;
  type?: 'text' | 'number';
  /** takes a whole row: addresses and free text read badly in a narrow column */
  wide?: boolean;
  /** every default points at this machine, so a recipe cannot reach a venue network unasked */
  defaultValue: string;
};

export type RecipeValues = Record<string, string>;

export type AutomationRecipe = {
  /** stable, client only. Never persisted */
  id: string;
  title: string;
  /** one line, plain language: what this does for the user */
  description: string;
  category: RecipeCategory;
  /** extra search terms: other names for the software, its protocol, the job it does */
  keywords?: string[];
  /** what the dialog asks for. Empty when the recipe needs nothing */
  params: RecipeParam[];
  triggers: TimerLifeCycle[];
  /** typed, so the compiler catches a recipe drifting from the automation schema */
  build: (values: RecipeValues) => AutomationDTO;
};

/** a user pasting an address is as likely to include the trailing slash as not */
function origin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

/** the recipe cannot know whether the user's URL already carries a query */
function withQuery(url: string, query: string): string {
  const trimmed = url.trim();
  return trimmed.includes('?') ? `${trimmed}&${query}` : `${trimmed}?${query}`;
}

export const automationRecipes: AutomationRecipe[] = [
  {
    id: 'ontime-aux-timer',
    title: 'Run an aux timer with the event',
    description: 'Sets aux timer 1 and starts it whenever an event starts.',
    category: 'ontime',
    keywords: ['countdown', 'stage timer', 'speaker'],
    params: [{ name: 'duration', label: 'Duration', hint: 'hh:mm:ss', defaultValue: '00:05:00' }],
    triggers: [Cycle.onStart],
    build: ({ duration }) => ({
      title: 'Run Aux Timer 1 with the event',
      filterRule: 'all',
      filters: [],
      outputs: [
        { type: 'ontime', action: 'aux1-set', time: duration.trim() },
        { type: 'ontime', action: 'aux1-start' },
      ],
    }),
  },
  {
    id: 'ontime-warn-stage',
    title: 'Warn the stage when time runs low',
    description: 'Shows a message on the stage timer as the running event enters its danger window.',
    category: 'ontime',
    keywords: ['message', 'danger', 'wrap up', 'presenter'],
    params: [{ name: 'message', label: 'Message', wide: true, defaultValue: 'Please wrap up' }],
    triggers: [Cycle.onDanger],
    build: ({ message }) => ({
      title: 'Warn the stage at danger',
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'ontime', action: 'message-set', text: message, visible: true }],
    }),
  },
  {
    id: 'ontime-clear-message',
    title: 'Hide the stage message on finish',
    description: 'Clears the stage message once the event finishes. Pairs with the warning above.',
    category: 'ontime',
    keywords: ['message', 'clear', 'presenter'],
    params: [],
    triggers: [Cycle.onFinish],
    build: () => ({
      title: 'Hide the stage message on finish',
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'ontime', action: 'message-set', text: '', visible: false }],
    }),
  },
  {
    id: 'qlab-go',
    title: 'QLab — fire the matching cue',
    description: "Starts the QLab cue whose number matches the Ontime event's cue.",
    category: 'playback',
    keywords: ['osc', 'sound', 'audio', 'mac', 'figure 53'],
    params: [
      {
        name: 'ip',
        label: 'QLab computer',
        hint: 'IP address of the machine running QLab',
        wide: true,
        defaultValue: '127.0.0.1',
      },
      { name: 'port', label: 'OSC port', type: 'number', hint: "QLab's default is 53000", defaultValue: '53000' },
    ],
    triggers: [Cycle.onStart],
    build: ({ ip, port }) => ({
      title: 'QLab GO on event start',
      filterRule: 'all',
      filters: [],
      outputs: [
        {
          type: 'osc',
          targetIP: ip.trim(),
          targetPort: Number(port),
          address: '/cue/{{eventNow.cue}}/start',
          args: '',
        },
      ],
    }),
  },
  {
    id: 'companion-press',
    title: 'Companion — press a button',
    description: 'Presses a Stream Deck button through the Companion HTTP API when an event starts.',
    category: 'playback',
    keywords: ['stream deck', 'bitfocus', 'obs', 'http', 'elgato'],
    params: [
      {
        name: 'host',
        label: 'Companion address',
        hint: 'Where the Companion HTTP API is listening',
        wide: true,
        defaultValue: 'http://127.0.0.1:8888',
      },
      { name: 'page', label: 'Page', type: 'number', defaultValue: '1' },
      { name: 'row', label: 'Row', type: 'number', defaultValue: '0' },
      { name: 'column', label: 'Column', type: 'number', defaultValue: '0' },
    ],
    triggers: [Cycle.onStart],
    build: ({ host, page, row, column }) => ({
      title: 'Companion button press',
      filterRule: 'all',
      filters: [],
      // Companion HTTP API: /api/location/<page>/<row>/<column>/press
      outputs: [{ type: 'http', url: `${origin(host)}/api/location/${page}/${row}/${column}/press` }],
    }),
  },
  {
    id: 'vmix-overlay-warning',
    title: 'vMix — show an overlay on warning',
    description: 'Triggers a vMix overlay through the web controller when the timer enters its warning window.',
    category: 'video',
    keywords: ['streaming', 'http', 'lower third', 'graphics'],
    params: [
      {
        name: 'host',
        label: 'vMix address',
        hint: 'The vMix web controller',
        wide: true,
        defaultValue: 'http://127.0.0.1:8088',
      },
      { name: 'overlay', label: 'Overlay number', type: 'number', defaultValue: '1' },
    ],
    triggers: [Cycle.onWarning],
    build: ({ host, overlay }) => ({
      title: 'vMix overlay on warning',
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'http', url: `${origin(host)}/api/?Function=OverlayInput${overlay}In` }],
    }),
  },
  {
    id: 'webhook-event-title',
    title: 'Webhook — post the running event',
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
      },
    ],
    triggers: [Cycle.onStart],
    build: ({ url }) => ({
      title: 'Webhook with the current event',
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'http', url: withQuery(url, 'title={{eventNow.title}}') }],
    }),
  },
];

/** the values the dialog starts with, so a recipe can be created without touching a field */
export function defaultValues(recipe: AutomationRecipe): RecipeValues {
  return Object.fromEntries(recipe.params.map(({ name, defaultValue }) => [name, defaultValue]));
}

/**
 * A recipe that only sends Ontime actions works the moment it is created.
 * Anything else points at software we cannot locate for the user.
 */
export function needsTarget(recipe: AutomationRecipe): boolean {
  return !recipe.build(defaultValues(recipe)).outputs.every((output) => output.type === 'ontime');
}
