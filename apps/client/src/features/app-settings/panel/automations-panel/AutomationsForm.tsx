import { Button, IconButton } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoPencil } from '@react-icons/all-files/io5/IoPencil';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { Automation, NormalisedAutomationBlueprint } from 'ontime-types';

import * as Panel from '../../panel-utils/PanelUtils';

interface AutomationsFormProps {
  automations: Automation[];
  blueprints: NormalisedAutomationBlueprint;
}

export default function AutomationsForm(props: AutomationsFormProps) {
  const { automations, blueprints } = props;
  return (
    <Panel.Card>
      <Panel.SubHeader>
        Manage automations
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

      <Panel.Table>
        <thead>
          {/* TODO: cleanup size styles */}
          <tr>
            <th style={{ width: '35%' }}>Title</th>
            <th style={{ width: '25%' }}>Trigger</th>
            <th style={{ width: '25%' }}>Blueprint</th>
            <th style={{ width: '15%' }} />
          </tr>
        </thead>
        <tbody>
          {automations.map((automation) => {
            const blueprintTitle = blueprints[automation.blueprintId].title;
            return (
              <tr key={automation.id}>
                <td>{automation.title}</td>
                <td>{automation.trigger}</td>
                <td>{blueprintTitle}</td>
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
    </Panel.Card>
  );
}
