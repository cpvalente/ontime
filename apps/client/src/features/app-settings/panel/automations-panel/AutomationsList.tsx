import { AutomationDTO, NormalisedAutomation } from 'ontime-types';
import { Fragment, useState } from 'react';
import { IoAdd, IoPencil, IoTrash } from 'react-icons/io5';

import { deleteAutomation } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Info from '../../../../common/components/info/Info';
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
  enabledAutomations?: boolean;
  isLoading: boolean;
}

export default function AutomationsList({ automations, enabledAutomations, isLoading }: AutomationsListProps) {
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
    <Panel.Section>
      <Panel.Card>
        {automationFormData !== null && (
          <AutomationForm automation={automationFormData} onClose={() => setAutomationFormData(null)} />
        )}
        <Panel.SubHeader>
          Manage automations
          <Button onClick={() => setAutomationFormData(automationPlaceholder)}>
            New <IoAdd />
          </Button>
        </Panel.SubHeader>

        <Panel.Divider />

        <Panel.Section>
          {enabledAutomations === false && (
            <Info>
              Automations are disabled. You can still manage automation definitions here, but they will not run until
              enabled.
            </Info>
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
              {!isLoading && arrayAutomations.length === 0 && (
                <Panel.TableEmpty
                  title='No automations yet'
                  description='An automation sends OSC or HTTP messages, or runs an Ontime action, whenever a trigger fires.'
                  action={
                    <Button variant='primary' onClick={() => setAutomationFormData(automationPlaceholder)}>
                      Create automation <IoAdd />
                    </Button>
                  }
                />
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
                          variant='ghosted-white'
                          aria-label='Edit entry'
                          onClick={() => setAutomationFormData(automations[automationId])}
                        >
                          <IoPencil />
                        </IconButton>
                        <IconButton
                          variant='ghosted-destructive'
                          aria-label='Delete entry'
                          onClick={() => handleDelete(automationId)}
                        >
                          <IoTrash />
                        </IconButton>
                      </Panel.InlineElements>
                    </tr>
                  </Fragment>
                );
              })}
              {deleteError && (
                <tr>
                  <td colSpan={5}>
                    <Panel.Error>{deleteError}</Panel.Error>
                  </td>
                </tr>
              )}
            </tbody>
          </Panel.Table>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
