import type { AutomationDTO, OSCOutput, TimerLifeCycle } from 'ontime-types';
import { TimerLifeCycle as Cycle } from 'ontime-types';

export type RecipeCategory = 'ontime' | 'playback' | 'video' | 'messaging';

export const recipeCategoryLabels: Record<RecipeCategory, string> = {
  ontime: 'Ontime automations',
  playback: 'Playback and cue systems',
  video: 'Video and streaming',
  messaging: 'Webhooks and messaging',
};

/** presentation order, empty categories are not rendered */
export const recipeCategoryOrder: RecipeCategory[] = ['ontime', 'playback', 'video', 'messaging'];

/** the software a recipe talks to, which is what users look for first */
export type RecipeSoftware = 'ontime' | 'qlab' | 'companion' | 'vmix' | 'webhook';

export const recipeSoftwareLabels: Record<RecipeSoftware, string> = {
  ontime: 'Ontime',
  qlab: 'QLab',
  companion: 'Companion',
  vmix: 'vMix',
  webhook: 'Webhooks',
};

/** presentation order of the filters, software without recipes is not rendered */
export const recipeSoftwareOrder: RecipeSoftware[] = ['ontime', 'qlab', 'companion', 'vmix', 'webhook'];

export type RecipeParam = {
  name: string;
  label: string;
  /** one line under the field, for anything the label cannot say */
  hint?: string;
  type?: 'text' | 'number' | 'choice';
  /** required by 'choice', which renders a select rather than a free field */
  options?: { value: string; label: string }[];
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
  software: RecipeSoftware;
  /** extra search terms: other names for the software, its protocol, the job it does */
  keywords?: string[];
  /** what the dialog asks for. Empty when the recipe needs nothing */
  params: RecipeParam[];
  triggers: TimerLifeCycle[];
  /** typed, so the compiler catches a recipe drifting from the automation schema */
  build: (values: RecipeValues) => AutomationDTO;
};

const auxTimers = [
  { value: '1', label: 'Aux timer 1' },
  { value: '2', label: 'Aux timer 2' },
  { value: '3', label: 'Aux timer 3' },
];

type AuxNumber = '1' | '2' | '3';

/**
 * Action keys are a union the compiler checks against the automation schema, so the aux
 * number is resolved through maps rather than string interpolation. Anything unexpected
 * falls back to the first timer instead of building an action the server would reject.
 */
function toAux(value: string): AuxNumber {
  return value === '2' || value === '3' ? value : '1';
}

const auxSet = { 1: 'aux1-set', 2: 'aux2-set', 3: 'aux3-set' } as const;
const auxStart = { 1: 'aux1-start', 2: 'aux2-start', 3: 'aux3-start' } as const;
const auxStop = { 1: 'aux1-stop', 2: 'aux2-stop', 3: 'aux3-stop' } as const;
const auxSource = { 1: 'aux1', 2: 'aux2', 3: 'aux3' } as const;

/** a user pasting an address is as likely to include the trailing slash as not */
function origin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

/** the recipe cannot know whether the user's URL already carries a query */
function withQuery(url: string, query: string): string {
  const trimmed = url.trim();
  return trimmed.includes('?') ? `${trimmed}&${query}` : `${trimmed}?${query}`;
}

/** an OSC output to a host the user named, with the port they typed */
function osc(ip: string, port: string, address: string, args = ''): OSCOutput {
  return { type: 'osc', targetIP: ip.trim(), targetPort: Number(port), address, args };
}

const qlabHost: RecipeParam = {
  name: 'ip',
  label: 'QLab computer',
  hint: 'IP address of the machine running QLab',
  wide: true,
  defaultValue: '127.0.0.1',
};
const qlabPort: RecipeParam = {
  name: 'port',
  label: 'OSC port',
  type: 'number',
  hint: "QLab's default is 53000",
  defaultValue: '53000',
};

const companionHost: RecipeParam = {
  name: 'ip',
  label: 'Companion computer',
  hint: 'IP address of the machine running Companion, with OSC enabled in its settings',
  wide: true,
  defaultValue: '127.0.0.1',
};
const companionPort: RecipeParam = {
  name: 'port',
  label: 'OSC port',
  type: 'number',
  hint: "Companion's default is 12321",
  defaultValue: '12321',
};

const vmixHost: RecipeParam = {
  name: 'host',
  label: 'vMix address',
  hint: 'The vMix web controller',
  wide: true,
  defaultValue: 'http://127.0.0.1:8088',
};

export const automationRecipes: AutomationRecipe[] = [
  {
    id: 'ontime-aux-timer',
    title: 'Run an aux timer with the event',
    description: 'Sets an aux timer and starts it whenever an event starts.',
    category: 'ontime',
    software: 'ontime',
    keywords: ['countdown', 'stage timer', 'speaker'],
    params: [
      { name: 'aux', label: 'Which timer', type: 'choice', options: auxTimers, defaultValue: '1' },
      { name: 'duration', label: 'Duration', hint: 'hh:mm:ss', defaultValue: '00:05:00' },
    ],
    triggers: [Cycle.onStart],
    build: ({ aux, duration }) => ({
      title: `Run Aux Timer ${toAux(aux)} with the event`,
      filterRule: 'all',
      filters: [],
      outputs: [
        { type: 'ontime', action: auxSet[toAux(aux)], time: duration.trim() },
        { type: 'ontime', action: auxStart[toAux(aux)] },
      ],
    }),
  },
  {
    id: 'ontime-aux-stop',
    title: 'Stop the aux timer when the event ends',
    description: 'Stops an aux timer on finish, so it does not keep running into the next event.',
    category: 'ontime',
    software: 'ontime',
    keywords: ['countdown', 'stage timer', 'reset'],
    params: [{ name: 'aux', label: 'Which timer', type: 'choice', options: auxTimers, defaultValue: '1' }],
    triggers: [Cycle.onFinish],
    build: ({ aux }) => ({
      title: `Stop Aux Timer ${toAux(aux)} on finish`,
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'ontime', action: auxStop[toAux(aux)] }],
    }),
  },
  {
    id: 'ontime-warn-stage',
    title: 'Warn the stage when time runs low',
    description: 'Shows a message on the stage timer as the running event enters its danger window.',
    category: 'ontime',
    software: 'ontime',
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
    description: 'Clears the stage message once the event finishes. Pairs with the low time warning.',
    category: 'ontime',
    software: 'ontime',
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
    id: 'ontime-secondary-message',
    title: 'Show an aux timer beside the stage message',
    description: 'Points the secondary field on the stage timer at an aux timer when an event loads.',
    category: 'ontime',
    software: 'ontime',
    keywords: ['message', 'secondary', 'stage', 'countdown'],
    params: [{ name: 'aux', label: 'Which timer', type: 'choice', options: auxTimers, defaultValue: '1' }],
    triggers: [Cycle.onLoad],
    build: ({ aux }) => ({
      title: `Show Aux Timer ${toAux(aux)} as the secondary message`,
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'ontime', action: 'message-secondary', secondarySource: auxSource[toAux(aux)] }],
    }),
  },
  {
    id: 'qlab-go',
    title: 'QLab — fire the matching cue',
    description: "Starts the QLab cue whose number matches the Ontime event's cue. Events without a cue are skipped.",
    category: 'playback',
    software: 'qlab',
    keywords: ['osc', 'sound', 'audio', 'mac', 'figure 53'],
    params: [qlabHost, qlabPort],
    triggers: [Cycle.onStart],
    build: ({ ip, port }) => ({
      title: 'QLab cue on event start',
      filterRule: 'all',
      // without a cue number the address would be /cue//start, which QLab ignores at best
      filters: [{ field: 'eventNow.cue', operator: 'not_equals', value: '' }],
      outputs: [osc(ip, port, '/cue/{{eventNow.cue}}/start')],
    }),
  },
  {
    id: 'qlab-go-next',
    title: 'QLab — press GO',
    description: 'Presses GO in the QLab workspace when an event starts, firing whatever cue is next.',
    category: 'playback',
    software: 'qlab',
    keywords: ['osc', 'sound', 'audio', 'mac', 'playhead', 'next'],
    params: [qlabHost, qlabPort],
    triggers: [Cycle.onStart],
    build: ({ ip, port }) => ({
      title: 'QLab GO on event start',
      filterRule: 'all',
      filters: [],
      outputs: [osc(ip, port, '/go')],
    }),
  },
  {
    id: 'qlab-panic',
    title: 'QLab — panic when Ontime stops',
    description: 'Fades out and stops every QLab cue when the timer is stopped, so nothing plays over a halted show.',
    category: 'playback',
    software: 'qlab',
    keywords: ['osc', 'sound', 'audio', 'stop', 'fade', 'emergency'],
    params: [qlabHost, qlabPort],
    triggers: [Cycle.onStop],
    build: ({ ip, port }) => ({
      title: 'QLab panic on stop',
      filterRule: 'all',
      filters: [],
      outputs: [osc(ip, port, '/panic')],
    }),
  },
  {
    id: 'companion-press',
    title: 'Companion — press a button',
    description: 'Presses a Companion button over OSC when an event starts, to run anything Companion controls.',
    category: 'playback',
    software: 'companion',
    keywords: ['stream deck', 'bitfocus', 'osc', 'elgato', 'atem', 'obs'],
    params: [
      companionHost,
      companionPort,
      { name: 'page', label: 'Page', type: 'number', defaultValue: '1' },
      { name: 'row', label: 'Row', type: 'number', defaultValue: '0' },
      { name: 'column', label: 'Column', type: 'number', defaultValue: '0' },
    ],
    triggers: [Cycle.onStart],
    build: ({ ip, port, page, row, column }) => ({
      title: `Companion press ${page}/${row}/${column} on event start`,
      filterRule: 'all',
      filters: [],
      // Companion OSC API: /location/<page>/<row>/<column>/press
      outputs: [osc(ip, port, `/location/${page}/${row}/${column}/press`)],
    }),
  },
  {
    id: 'companion-variable',
    title: 'Companion — show the event title',
    description: 'Writes the loaded event title to a Companion custom variable, to show on a button or feed a module.',
    category: 'playback',
    software: 'companion',
    keywords: ['stream deck', 'bitfocus', 'osc', 'elgato', 'custom variable', 'label'],
    params: [
      companionHost,
      companionPort,
      {
        name: 'variable',
        label: 'Custom variable',
        hint: 'Its name in Companion, without the $(custom:) prefix',
        wide: true,
        defaultValue: 'ontime_title',
      },
    ],
    triggers: [Cycle.onLoad],
    build: ({ ip, port, variable }) => ({
      title: `Companion variable ${variable.trim()} from event title`,
      filterRule: 'all',
      filters: [],
      // quoted, so a title with spaces stays one string argument
      outputs: [osc(ip, port, `/custom-variable/${variable.trim()}/value`, '"{{eventNow.title}}"')],
    }),
  },
  {
    id: 'vmix-overlay-warning',
    title: 'vMix — show an overlay on warning',
    description: 'Triggers a vMix overlay through the web controller when the timer enters its warning window.',
    category: 'video',
    software: 'vmix',
    keywords: ['streaming', 'http', 'lower third', 'graphics'],
    params: [vmixHost, { name: 'overlay', label: 'Overlay number', type: 'number', defaultValue: '1' }],
    triggers: [Cycle.onWarning],
    build: ({ host, overlay }) => ({
      title: `vMix overlay ${overlay} on warning`,
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'http', url: `${origin(host)}/api/?Function=OverlayInput${overlay}In` }],
    }),
  },
  {
    id: 'vmix-cut-input',
    title: 'vMix — cut to an input',
    description: 'Cuts an input straight to program when an event starts, eg. the camera on the next speaker.',
    category: 'video',
    software: 'vmix',
    keywords: ['streaming', 'http', 'switcher', 'camera', 'program'],
    params: [vmixHost, { name: 'input', label: 'Input', hint: 'Number or name', defaultValue: '1' }],
    triggers: [Cycle.onStart],
    build: ({ host, input }) => ({
      title: `vMix cut to input ${input.trim()} on event start`,
      filterRule: 'all',
      filters: [],
      outputs: [
        { type: 'http', url: `${origin(host)}/api/?Function=CutDirect&Input=${encodeURIComponent(input.trim())}` },
      ],
    }),
  },
  {
    id: 'vmix-title-text',
    title: 'vMix — put the event title in a graphic',
    description: 'Writes the loaded event title into a text field of a vMix title input.',
    category: 'video',
    software: 'vmix',
    keywords: ['streaming', 'http', 'lower third', 'graphics', 'gt', 'text'],
    params: [
      vmixHost,
      { name: 'input', label: 'Title input', hint: 'Number or name', defaultValue: '1' },
      {
        name: 'field',
        label: 'Text field',
        hint: 'As named in the title template',
        defaultValue: 'Headline.Text',
      },
    ],
    triggers: [Cycle.onLoad],
    build: ({ host, input, field }) => ({
      title: `vMix title ${input.trim()} from event title`,
      filterRule: 'all',
      filters: [],
      outputs: [
        {
          type: 'http',
          url: `${origin(host)}/api/?Function=SetText&Input=${encodeURIComponent(input.trim())}&SelectedName=${encodeURIComponent(field.trim())}&Value={{eventNow.title}}`,
        },
      ],
    }),
  },
  {
    id: 'webhook-event-title',
    title: 'Webhook — post the running event',
    description: 'Calls any URL with the running event title, as a template string you can edit afterwards.',
    category: 'messaging',
    software: 'webhook',
    keywords: ['http', 'rest', 'api', 'integration', 'get'],
    params: [
      {
        name: 'url',
        label: 'URL',
        hint: 'Called with a GET request, the event title is added as a title parameter',
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
