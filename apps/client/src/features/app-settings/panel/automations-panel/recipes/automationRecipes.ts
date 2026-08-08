import type { AutomationDTO, TimerLifeCycle } from 'ontime-types';
import { TimerLifeCycle as Cycle } from 'ontime-types';

export type RecipeCategory = 'video' | 'audio' | 'playback' | 'messaging' | 'ontime';

export type AutomationRecipe = {
  /** stable, client only. Never persisted */
  id: string;
  title: string;
  /** one line, plain language: what this does for the user */
  description: string;
  category: RecipeCategory;
  docsUrl?: string;
  /** true when the recipe points at external software the user has to locate */
  needsSetup: boolean;
  /** typed so the compiler catches drift against the automation schema */
  automation: AutomationDTO;
  triggers: TimerLifeCycle[];
};

export const recipeCategoryLabels: Record<RecipeCategory, string> = {
  ontime: 'Works out of the box',
  playback: 'Playback and cue systems',
  video: 'Video and streaming',
  audio: 'Audio',
  messaging: 'Webhooks and messaging',
};

/** presentation order for the library */
export const recipeCategoryOrder: RecipeCategory[] = ['ontime', 'video', 'playback', 'audio', 'messaging'];

/**
 * Every recipe targets loopback by default.
 * A recipe added by mistake must not put traffic on a venue network, so the user
 * has to point it somewhere real before it can reach anything.
 */
export const automationRecipes: AutomationRecipe[] = [
  {
    id: 'ontime-aux-timer',
    title: 'Start Aux Timer 1 with the event',
    description: 'Sets aux timer 1 to five minutes and starts it whenever an event starts.',
    category: 'ontime',
    needsSetup: false,
    automation: {
      title: 'Start Aux Timer 1 with the event',
      filterRule: 'all',
      filters: [],
      outputs: [
        { type: 'ontime', action: 'aux1-set', time: '00:05:00' },
        { type: 'ontime', action: 'aux1-start' },
      ],
    },
    triggers: [Cycle.onStart],
  },
  {
    id: 'ontime-warn-stage',
    title: 'Warn the stage when the timer hits danger',
    description: 'Shows a message on the stage timer as soon as the running event enters its danger window.',
    category: 'ontime',
    needsSetup: false,
    automation: {
      title: 'Warn the stage at danger',
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'ontime', action: 'message-set', text: 'Please wrap up', visible: true }],
    },
    triggers: [Cycle.onDanger],
  },
  {
    id: 'ontime-clear-message',
    title: 'Hide the stage message on finish',
    description: 'Hides the stage message once the event finishes. Pairs with the danger warning above.',
    category: 'ontime',
    needsSetup: false,
    automation: {
      title: 'Hide the stage message on finish',
      filterRule: 'all',
      filters: [],
      // an empty text means "leave the text alone", so this only changes visibility
      outputs: [{ type: 'ontime', action: 'message-set', text: '', visible: false }],
    },
    triggers: [Cycle.onFinish],
  },
  {
    id: 'obs-record',
    title: 'OBS — start recording when the show starts',
    description: 'Calls the OBS websocket HTTP bridge when the first event is loaded.',
    category: 'video',
    needsSetup: true,
    automation: {
      title: 'OBS start recording',
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'http', url: 'http://127.0.0.1:4455/api/StartRecord' }],
    },
    triggers: [Cycle.onLoad],
  },
  {
    id: 'vmix-overlay-warning',
    title: 'vMix — show an overlay on timer warning',
    description: 'Triggers a vMix overlay through the web controller when the timer enters its warning window.',
    category: 'video',
    needsSetup: true,
    automation: {
      title: 'vMix overlay on warning',
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'http', url: 'http://127.0.0.1:8088/api/?Function=OverlayInput1In' }],
    },
    triggers: [Cycle.onWarning],
  },
  {
    id: 'qlab-go',
    title: 'QLab — fire the matching cue on event start',
    description: "Sends OSC to QLab to start the cue whose number matches the Ontime event's cue.",
    category: 'playback',
    needsSetup: true,
    automation: {
      title: 'QLab GO on event start',
      filterRule: 'all',
      filters: [],
      outputs: [
        { type: 'osc', targetIP: '127.0.0.1', targetPort: 53000, address: '/cue/{{eventNow.cue}}/start', args: '' },
      ],
    },
    triggers: [Cycle.onStart],
  },
  {
    id: 'companion-press',
    title: 'Companion — press a button on event start',
    description: 'Presses page 1 button 1 on a Stream Deck through the Companion HTTP API.',
    category: 'playback',
    needsSetup: true,
    automation: {
      title: 'Companion button press',
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'http', url: 'http://127.0.0.1:8888/api/location/1/0/0/press' }],
    },
    triggers: [Cycle.onStart],
  },
  {
    id: 'webhook-event-title',
    title: 'Webhook — send the current event title',
    description: 'Posts the running event title to any URL. A good place to see template strings at work.',
    category: 'messaging',
    docsUrl: 'https://docs.getontime.no/api/automation/#using-variables-in-automation',
    needsSetup: true,
    automation: {
      title: 'Webhook with the current event',
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'http', url: 'http://127.0.0.1:3000/now?title={{eventNow.title}}' }],
    },
    triggers: [Cycle.onStart],
  },
];
