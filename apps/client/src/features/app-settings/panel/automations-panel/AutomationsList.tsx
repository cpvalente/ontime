import { Fragment, useState } from 'react';
import { Button, IconButton } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoPencil } from '@react-icons/all-files/io5/IoPencil';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { AutomationDTO, NormalisedAutomation } from 'ontime-types';

import { deleteAutomation } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Tag from '../../../../common/components/tag/Tag';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import * as Panel from '../../panel-utils/PanelUtils';

import AutomationForm from './AutomationForm';

const automationPlaceholder: AutomationDTO = {
  title: '',
  filterRule: 'all',
  filters: [],
  outputs: [],
};

interface AutomationsListProps {
  automations: NormalisedAutomation;
}

export default function AutomationsList(props: AutomationsListProps) {
  const { automations } = props;
  const { refetch } = useAutomationSettings();
  const [automationFormData, setAutomationFormData] = useState<AutomationDTO | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeleteError(null);
      await deleteAutomation(id);
    } catch (error) {
      setDeleteError(maybeAxiosError(error));
    } finally {
      refetch();
    }
  };

  const arrayAutomations = Object.keys(automations);

  return (
    <Panel.Card>
      <Panel.SubHeader>
        Manage automations
        <Button
          variant='ontime-subtle'
          rightIcon={<IoAdd />}
          size='sm'
          type='submit'
          isDisabled={Boolean(automationFormData)}
          onClick={() => setAutomationFormData(automationPlaceholder)}
        >
          New
        </Button>
      </Panel.SubHeader>

      <Panel.Divider />

      {automationFormData !== null && (
        <AutomationForm automation={automationFormData} onClose={() => setAutomationFormData(null)} />
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
          {arrayAutomations.length === 0 && (
            <Panel.TableEmpty handleClick={() => setAutomationFormData(automationPlaceholder)} />
          )}
          {arrayAutomations.map((automationId) => {
            if (!Object.hasOwn(automations, automationId)) {
              return null;
            }
            return (
              <Fragment key={automationId}>
                <tr>
                  <td>{automations[automationId].title}</td>
                  <td>
                    <Tag>{automations[automationId].filterRule}</Tag>
                  </td>
                  <td>{automations[automationId].filters.length}</td>
                  <td>{automations[automationId].outputs.length}</td>
                  <Panel.InlineElements align='end' relation='inner' as='td'>
                    <IconButton
                      size='sm'
                      variant='ontime-ghosted'
                      color='#e2e2e2' // $gray-200
                      icon={<IoPencil />}
                      aria-label='Edit entry'
                      onClick={() => setAutomationFormData(automations[automationId])}
                    />
                    <IconButton
                      size='sm'
                      variant='ontime-ghosted'
                      color='#FA5656' // $red-500
                      icon={<IoTrash />}
                      aria-label='Delete entry'
                      onClick={() => handleDelete(automationId)}
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
