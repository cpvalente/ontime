import { getTimeOption, hideTimerSeconds } from '../../../common/components/view-params-editor/constants';
import { ViewOption } from '../../../common/components/view-params-editor/types';

const makePersistedField = (id: string, value: string): ViewOption => {
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
  { section: 'Clock Options' },
  getTimeOption(timeFormat),
  { section: 'Timer Options' },
  hideTimerSeconds,
  { section: 'View behaviour' },
  {
    id: 'showProjected',
    title: 'Show projected time',
    description: 'Show projected times for the event, as well as apply the runtime offset to the timer.',
    type: 'boolean',
    defaultValue: false,
  },
  ...(persisted ? [makePersistedField(persisted.id, persisted.value)] : []),
];
