import { useState } from 'react';
import { Button, IconButton } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoPencil } from '@react-icons/all-files/io5/IoPencil';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { AutomationBlueprintDTO, NormalisedAutomationBlueprint } from 'ontime-types';

import { deleteBlueprint } from '../../../../common/api/automation';
import Tag from '../../../../common/components/tag/Tag';
import * as Panel from '../../panel-utils/PanelUtils';

import BlueprintForm from './BlueprintForm';

const automationBlueprintPlaceholder: AutomationBlueprintDTO = {
  title: '',
  filterRule: 'all',
  filters: [],
  outputs: [],
};

interface BlueprintsListProps {
  blueprints: NormalisedAutomationBlueprint;
}

export default function BlueprintsList(props: BlueprintsListProps) {
  const { blueprints } = props;
  const [blueprintFormData, setBlueprintFormData] = useState<AutomationBlueprintDTO | AutomationBlueprintDTO | null>(
    null,
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteBlueprint(id);
    } catch (_error) {
      /** we do not handle errors here */
    }
  };

  const arrayBlueprints = Object.keys(blueprints);

  return (
    <Panel.Card>
      <Panel.SubHeader>
        Manage blueprints
        <Button
          variant='ontime-subtle'
          rightIcon={<IoAdd />}
          size='sm'
          type='submit'
          isDisabled={Boolean(blueprintFormData)}
          onClick={() => setBlueprintFormData(automationBlueprintPlaceholder)}
        >
          New
        </Button>
      </Panel.SubHeader>

      <Panel.Divider />

      {blueprintFormData !== null && (
        <BlueprintForm blueprint={blueprintFormData} onClose={() => setBlueprintFormData(null)} />
      )}

      <Panel.Table>
        <thead>
          <tr>
            <th style={{ width: '30%' }}>Title</th>
            <th style={{ width: '30%' }}>Trigger rule</th>
            <th>Filters</th>
            <th>Outputs</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {arrayBlueprints.map((blueprintId) => {
            if (!Object.hasOwn(blueprints, blueprintId)) {
              return null;
            }
            return (
              <tr key={blueprintId}>
                <td>{blueprints[blueprintId].title}</td>
                <td>
                  <Tag>{blueprints[blueprintId].filterRule}</Tag>
                </td>
                <td>{blueprints[blueprintId].filters.length}</td>
                <td>{blueprints[blueprintId].outputs.length}</td>
                <td>
                  <IconButton
                    size='sm'
                    variant='ontime-ghosted'
                    color='#e2e2e2' // $gray-200
                    icon={<IoPencil />}
                    aria-label='Edit entry'
                    onClick={() => setBlueprintFormData(blueprints[blueprintId])}
                  />
                  <IconButton
                    size='sm'
                    variant='ontime-ghosted'
                    color='#FA5656' // $red-500
                    icon={<IoTrash />}
                    aria-label='Delete entry'
                    onClick={() => handleDelete(blueprintId)}
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