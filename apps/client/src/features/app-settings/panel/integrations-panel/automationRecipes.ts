import { type AutomationDTO, TimerLifeCycle } from 'ontime-types';

export type AutomationRecipe = {
  /** the global trigger the form offers to create with the automation */
  trigger: TimerLifeCycle;
  /** its title also names the recipe in the picker */
  automation: AutomationDTO;
};

export type RecipeGroup = {
  software: string;
  recipes: AutomationRecipe[];
};

const noFilters: Pick<AutomationDTO, 'filterRule' | 'filters'> = { filterRule: 'all', filters: [] };
// every target defaults to this machine
const qlab = { type: 'osc', targetIP: '127.0.0.1', targetPort: 53000, args: '' } as const;
const companion = { type: 'osc', targetIP: '127.0.0.1', targetPort: 12321, args: '' } as const;
const vmix = 'http://127.0.0.1:8088/api/?Function=';
const propresenter = 'http://127.0.0.1:1025/v1';

export const recipeGroups: RecipeGroup[] = [
  {
    software: 'Ontime',
    recipes: [
      {
        trigger: TimerLifeCycle.onStart,
        automation: {
          title: 'Start aux timer 1 for 5 minutes',
          ...noFilters,
          outputs: [
            { type: 'ontime', action: 'aux1-set', time: '5m' },
            { type: 'ontime', action: 'aux1-start' },
          ],
        },
      },
      {
        trigger: TimerLifeCycle.onDanger,
        automation: {
          title: 'Show a timer message at danger',
          ...noFilters,
          outputs: [{ type: 'ontime', action: 'message-set', text: 'Please wrap up', visible: true }],
        },
      },
      {
        trigger: TimerLifeCycle.onFinish,
        automation: {
          title: 'Hide the timer message',
          ...noFilters,
          outputs: [{ type: 'ontime', action: 'message-set', text: '', visible: false }],
        },
      },
      {
        trigger: TimerLifeCycle.onStart,
        automation: {
          title: 'Reset the offset when the show starts',
          filterRule: 'all',
          filters: [{ field: 'rundown.selectedEventIndex', operator: 'equals', value: '0' }],
          outputs: [{ type: 'ontime', action: 'offset-reset' }],
        },
      },
    ],
  },
  {
    software: 'QLab',
    recipes: [
      {
        trigger: TimerLifeCycle.onStart,
        automation: {
          title: 'QLab: fire the matching cue',
          filterRule: 'all',
          // without a cue the address would be /cue//start
          filters: [{ field: 'eventNow.cue', operator: 'not_equals', value: '' }],
          outputs: [{ ...qlab, address: '/cue/{{eventNow.cue}}/start' }],
        },
      },
      {
        trigger: TimerLifeCycle.onStart,
        automation: { title: 'QLab: GO', ...noFilters, outputs: [{ ...qlab, address: '/go' }] },
      },
      {
        trigger: TimerLifeCycle.onStop,
        automation: { title: 'QLab: panic', ...noFilters, outputs: [{ ...qlab, address: '/panic' }] },
      },
    ],
  },
  {
    software: 'Companion',
    recipes: [
      {
        trigger: TimerLifeCycle.onStart,
        automation: {
          title: 'Companion: press a button',
          ...noFilters,
          // page, row, column
          outputs: [{ ...companion, address: '/location/1/0/0/press' }],
        },
      },
      {
        trigger: TimerLifeCycle.onLoad,
        automation: {
          title: 'Companion: event title into a variable',
          ...noFilters,
          // quoted, so a title with spaces stays one argument
          outputs: [{ ...companion, address: '/custom-variable/ontime_title/value', args: '"{{eventNow.title}}"' }],
        },
      },
    ],
  },
  {
    software: 'vMix',
    recipes: [
      {
        trigger: TimerLifeCycle.onWarning,
        automation: {
          title: 'vMix: overlay an input',
          ...noFilters,
          outputs: [{ type: 'http', url: `${vmix}OverlayInput1In&Input=1` }],
        },
      },
      {
        trigger: TimerLifeCycle.onStart,
        automation: {
          title: 'vMix: cut to an input',
          ...noFilters,
          outputs: [{ type: 'http', url: `${vmix}CutDirect&Input=1` }],
        },
      },
      {
        trigger: TimerLifeCycle.onLoad,
        automation: {
          title: 'vMix: event title into a graphic',
          ...noFilters,
          outputs: [
            { type: 'http', url: `${vmix}SetText&Input=1&SelectedName=Headline.Text&Value={{eventNow.title}}` },
          ],
        },
      },
    ],
  },
  {
    software: 'ProPresenter',
    recipes: [
      {
        trigger: TimerLifeCycle.onStart,
        automation: {
          title: 'ProPresenter: next slide',
          ...noFilters,
          outputs: [{ type: 'http', url: `${propresenter}/presentation/active/next/trigger` }],
        },
      },
      {
        trigger: TimerLifeCycle.onStart,
        automation: {
          title: 'ProPresenter: trigger a macro',
          ...noFilters,
          // the macro is addressed by name, UUID or index
          outputs: [{ type: 'http', url: `${propresenter}/macro/1/trigger` }],
        },
      },
      {
        trigger: TimerLifeCycle.onStop,
        automation: {
          title: 'ProPresenter: clear the slide',
          ...noFilters,
          outputs: [{ type: 'http', url: `${propresenter}/clear/layer/slide` }],
        },
      },
    ],
  },
];

/** Ontime Cloud cannot reach a venue network over OSC */
export function withoutOscRecipes(groups: RecipeGroup[]): RecipeGroup[] {
  return groups
    .map(({ software, recipes }) => ({
      software,
      recipes: recipes.filter(({ automation }) => automation.outputs.every(({ type }) => type !== 'osc')),
    }))
    .filter(({ recipes }) => recipes.length > 0);
}
