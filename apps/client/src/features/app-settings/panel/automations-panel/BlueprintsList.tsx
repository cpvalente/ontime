import { Fragment, useState } from 'react';
import { Button, IconButton } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoPencil } from '@react-icons/all-files/io5/IoPencil';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { AutomationBlueprintDTO, NormalisedAutomationBlueprint } from 'ontime-types';

import { deleteBlueprint } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
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
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeleteError(null);
      await deleteBlueprint(id);
    } catch (error) {
      setDeleteError(maybeAxiosError(error));
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
            <th style={{ width: '45%' }}>Title</th>
            <th style={{ width: '15%' }}>Trigger rule</th>
            <th style={{ width: '15%' }}>Filters</th>
            <th style={{ width: '15%' }}>Outputs</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {arrayBlueprints.length === 0 && (
            <Panel.TableEmpty handleClick={() => setBlueprintFormData(automationBlueprintPlaceholder)} />
          )}
          {arrayBlueprints.map((blueprintId) => {
            if (!Object.hasOwn(blueprints, blueprintId)) {
              return null;
            }
            return (
              <Fragment key={blueprintId}>
                <tr>
                  <td>{blueprints[blueprintId].title}</td>
                  <td>
                    <Tag>{blueprints[blueprintId].filterRule}</Tag>
                  </td>
                  <td>{blueprints[blueprintId].filters.length}</td>
                  <td>{blueprints[blueprintId].outputs.length}</td>
                  <Panel.InlineElements align='end' relation='inner' as='td'>
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
                  </Panel.InlineElements>
                </tr>
                {deleteError && (
                  <tr>
                    <td colSpan={5}>
                      <Panel.Error>{deleteError}</Panel.Error>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </Panel.Table>
    </Panel.Card>
  );
}
