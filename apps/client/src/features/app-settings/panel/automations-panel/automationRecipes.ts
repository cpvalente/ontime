import type { AutomationDTO, TimerLifeCycle } from 'ontime-types';
import { TimerLifeCycle as Cycle } from 'ontime-types';

export type RecipeValues = Record<string, string>;

export type AutomationRecipe = {
  id: string;
  title: string;
  description: string;
  lifecycles: TimerLifeCycle[];
  params: { name: string; label: string; defaultValue: string; type?: 'number' }[];
  build: (values: RecipeValues) => AutomationDTO;
};

function definition(title: string, outputs: AutomationDTO['outputs']): AutomationDTO {
  return { title, filterRule: 'all', filters: [], outputs };
}

export const automationRecipes: AutomationRecipe[] = [
  {
    id: 'qlab-go',
    title: 'QLab — fire the matching cue',
    description: 'Sends an OSC GO message for the event cue when an event starts.',
    lifecycles: [Cycle.onStart],
    params: [
      { name: 'host', label: 'QLab host', defaultValue: '127.0.0.1' },
      { name: 'port', label: 'OSC port', defaultValue: '53000', type: 'number' },
    ],
    build: ({ host, port }) =>
      definition('QLab GO on event start', [
        {
          type: 'osc',
          targetIP: host.trim(),
          targetPort: Number(port),
          address: '/cue/{{eventNow.cue}}/start',
          args: '',
        },
      ]),
  },
  {
    id: 'webhook-event-title',
    title: 'Webhook — send the event title',
    description: 'Calls a webhook with the running event title when an event starts.',
    lifecycles: [Cycle.onStart],
    params: [{ name: 'url', label: 'Webhook URL', defaultValue: 'http://127.0.0.1:3000/ontime' }],
    build: ({ url }) =>
      definition('Send event title to webhook', [
        { type: 'http', url: `${url.trim()}${url.includes('?') ? '&' : '?'}title={{url:eventNow.title}}` },
      ]),
  },
  {
    id: 'ontime-stage-warning',
    title: 'Ontime — show a stage warning',
    description: 'Shows a message in Ontime when an event reaches its danger window.',
    lifecycles: [Cycle.onDanger],
    params: [{ name: 'message', label: 'Message', defaultValue: 'Please wrap up' }],
    build: ({ message }) =>
      definition('Warn the stage at danger', [{ type: 'ontime', action: 'message-set', text: message, visible: true }]),
  },
];

export function defaultRecipeValues(recipe: AutomationRecipe): RecipeValues {
  return Object.fromEntries(recipe.params.map((param) => [param.name, param.defaultValue]));
}
