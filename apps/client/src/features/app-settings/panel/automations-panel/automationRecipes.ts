import type { AutomationDTO, TimerLifeCycle } from 'ontime-types';
import { isOntimeAction, TimerLifeCycle as Cycle } from 'ontime-types';

/**
 * A recipe is a pre-filled automation form, nothing more.
 * Choosing one opens the normal form with its values in place: the user reviews it,
 * points it at their own gear and saves. Nothing is written until they do.
 */
export type AutomationRecipe = {
  /** stable, client only. Never persisted */
  id: string;
  /** one line, plain language: what this does for the user */
  description: string;
  /** typed so the compiler catches drift against the automation schema */
  automation: AutomationDTO;
  /** lifecycles the form starts with selected */
  triggers: TimerLifeCycle[];
};

/**
 * A recipe that only sends Ontime actions works the moment it is saved.
 * Anything else points at software we cannot locate for the user.
 */
export function needsTarget(recipe: AutomationRecipe): boolean {
  return !recipe.automation.outputs.every(isOntimeAction);
}

/**
 * Every recipe targets loopback by default.
 * A recipe saved without thinking must not put traffic on a venue network, so the user
 * has to point it somewhere real before it can reach anything.
 *
 * Ordered so the ones that work out of the box come first.
 */
export const automationRecipes: AutomationRecipe[] = [
  {
    id: 'ontime-aux-timer',
    description: 'Sets aux timer 1 to five minutes and starts it whenever an event starts.',
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
    description: 'Shows a message on the stage timer as soon as the running event enters its danger window.',
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
    description: 'Hides the stage message once the event finishes. Pairs with the danger warning above.',
    automation: {
      title: 'Hide the stage message on finish',
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'ontime', action: 'message-set', text: '', visible: false }],
    },
    triggers: [Cycle.onFinish],
  },
  {
    id: 'qlab-go',
    description: "Sends OSC to QLab to start the cue whose number matches the Ontime event's cue.",
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
    description: 'Presses page 1, button 1 on a Stream Deck through the Companion HTTP API.',
    automation: {
      title: 'Companion button press',
      filterRule: 'all',
      filters: [],
      // Companion HTTP API: /api/location/<page>/<row>/<column>/press
      outputs: [{ type: 'http', url: 'http://127.0.0.1:8888/api/location/1/0/0/press' }],
    },
    triggers: [Cycle.onStart],
  },
  {
    id: 'vmix-overlay-warning',
    description: 'Triggers a vMix overlay through the web controller when the timer enters its warning window.',
    automation: {
      title: 'vMix overlay on warning',
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'http', url: 'http://127.0.0.1:8088/api/?Function=OverlayInput1In' }],
    },
    triggers: [Cycle.onWarning],
  },
  {
    id: 'webhook-event-title',
    description: 'Posts the running event title to any URL. A good place to see template strings at work.',
    automation: {
      title: 'Webhook with the current event',
      filterRule: 'all',
      filters: [],
      outputs: [{ type: 'http', url: 'http://127.0.0.1:3000/now?title={{eventNow.title}}' }],
    },
    triggers: [Cycle.onStart],
  },
];
