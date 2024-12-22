import { Button, IconButton, Modal } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoPencil } from '@react-icons/all-files/io5/IoPencil';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { TimerLifeCycle } from 'ontime-types';

import * as Panel from '../../panel-utils/PanelUtils';

import style from './AutomationManagement.module.scss';

// TODO: extract types to shared
export type FilterRule = 'all' | 'any';
export type Automation = {
  id: string;
  title: string;
  filterRule: FilterRule;
  trigger: TimerLifeCycle;
  filters: AutomationFilter[];
  outputs: AutomationOutput[];
};

export type AutomationFilter = {
  field: string; // this should be a key of a OntimeEvent + custom fields
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: string; // we use string but would coerce to the field value
};

export type AutomationOutput = OSCOutput | HTTPOutput | CompanionOutput;

export type OSCOutput = {
  type: 'osc';
  targetIP: string;
  targetPort: number;
  address: string;
  message: string;
};

export type HTTPOutput = {
  type: 'http';
  url: string;
};

export type CompanionOutput = {
  type: 'companion';
  targetIP: string;
  address: string;
  page: number;
  bank: number;
};

const data: Automation[] = [
  {
    id: '1',
    title: 'Automation 1',
    trigger: TimerLifeCycle.onClock,
    filterRule: 'all',
    filters: [
      {
        field: 'title',
        operator: 'equals',
        value: 'ontime',
      },
    ],
    outputs: [
      {
        type: 'osc',
        targetIP: '127.0.0.1',
        targetPort: 1234,
        address: '/test',
        message: 'test message',
      },
      {
        type: 'http',
        url: '/test',
      },
      {
        type: 'companion',
        targetIP: '127.0.0.1',
        address: '/test',
        page: 1,
        bank: 1,
      },
    ],
  },
];

// TODO: cleanup naming Automation <> Integration
// TODO: Element should be called Panel
export default function AutomationManagement() {
  return (
    <Panel.Card>
      <Panel.SubHeader>
        Manage automations
        {/* TODO: match styles */}
        <Button
          variant='ontime-subtle'
          rightIcon={<IoAdd />}
          size='sm'
          type='submit'
          form='osc-form'
          isDisabled={false}
          isLoading={false}
        >
          New
        </Button>
      </Panel.SubHeader>

      <Panel.Divider />

      <Panel.Section
        as='form'
        id='automations-form'
        onSubmit={() => undefined}
        onKeyDown={() => console.log('prevent escapee')}
      >
        <Panel.Table>
          <thead>
            {/* TODO: cleanup size styles */}
            <tr>
              <th style={{ width: '50%' }}>Title</th>
              <th style={{ width: '30%' }}>Trigger</th>
              <th>Filters</th>
              <th>Outputs</th>
              <th style={{ width: '15%' }} />
            </tr>
          </thead>
          <tbody>
            {data.map((automation) => {
              return (
                <tr key={automation.id}>
                  <td>{automation.title}</td>
                  <td>{automation.trigger}</td>
                  <td>{automation.filters.length}</td>
                  <td>{automation.outputs.length}</td>
                  <td>
                    <IconButton
                      size='sm'
                      variant='ontime-ghosted'
                      color='#e2e2e2' // $gray-200
                      icon={<IoPencil />}
                      aria-label='Edit entry'
                      onClick={() => console.log('edit')}
                    />
                    <IconButton
                      size='sm'
                      variant='ontime-ghosted'
                      color='#FA5656' // $red-500
                      icon={<IoTrash />}
                      aria-label='Delete entry'
                      onClick={() => console.log('delete')}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Panel.Table>
      </Panel.Section>
    </Panel.Card>
  );
}
