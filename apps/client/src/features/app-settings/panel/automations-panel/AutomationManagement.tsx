import { Button } from '@chakra-ui/react';
import { TimerLifeCycle } from 'ontime-types';

import * as Panel from '../../panel-utils/PanelUtils';

import AutomationItem from './AutomationItem';

import style from './AutomationManagement.module.scss';

const data = [
  {
    id: '1',
    title: 'Automation 1',
    trigger: TimerLifeCycle.onClock,
    filterRule: 'all',
    filter: [],
    output: [],
  },
  {
    id: '2',
    title: 'Automation 1',
    trigger: TimerLifeCycle.onClock,
    filterRule: 'all',
    filter: [],
    output: [],
  },
  {
    id: '3',
    title: 'Automation 1',
    trigger: TimerLifeCycle.onClock,
    filterRule: 'all',
    filter: [],
    output: [],
  },
];

export default function AutomationManagement() {
  return (
    <Panel.Card>
      <Panel.SubHeader>
        Manage automations
        <div>
          <Button variant='ontime-ghosted' size='sm' onClick={() => undefined} isDisabled={false}>
            Revert to saved
          </Button>
          <Button variant='ontime-filled' size='sm' type='submit' form='osc-form' isDisabled={false} isLoading={false}>
            Save
          </Button>
        </div>
      </Panel.SubHeader>

      <Panel.Divider />

      <Panel.Section
        as='form'
        id='automations-form'
        onSubmit={() => undefined}
        onKeyDown={() => console.log('prevent escapee')}
      >
        <Panel.Loader isLoading={false} />
        <ul className={style.list}>
          {data.map((automation) => {
            return <AutomationItem key={automation.id} title={automation.title} trigger={automation.trigger} />;
          })}
        </ul>
      </Panel.Section>
    </Panel.Card>
  );
}
