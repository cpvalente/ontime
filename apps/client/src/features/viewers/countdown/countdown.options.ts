import { getTimeOption, hideTimerSeconds, OptionTitle } from '../../../common/components/view-params-editor/constants';
import { ParamField, ViewOption } from '../../../common/components/view-params-editor/types';

const makePersistedField = (id: string, value: string): ParamField => {
  return {
    id,
    title: 'Used to keep the selection on submit',
    description: 'Used to keep the selection on submit',
    type: 'persist',
    value,
  };
};

type Persisted = { id: string; value: string };
export const getCountdownOptions = (timeFormat: string, persisted?: Persisted): ViewOption[] => [
  { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
  { title: OptionTitle.TimerOptions, collapsible: true, options: [hideTimerSeconds] },
  {
    title: OptionTitle.BehaviourOptions,
    collapsible: true,
    options: [
      {
        id: 'showProjected',
        title: 'Show projected time',
        description: 'Show projected times for the event, as well as apply the runtime offset to the timer.',
        type: 'boolean',
        defaultValue: false,
      },
      ...(persisted ? [makePersistedField(persisted.id, persisted.value)] : []),
    ],
  },
];
