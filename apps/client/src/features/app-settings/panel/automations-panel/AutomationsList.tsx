import { Fragment, useMemo, useState } from 'react';
import { Button } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { Automation, NormalisedAutomationBlueprint } from 'ontime-types';

import { deleteAutomation } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import * as Panel from '../../panel-utils/PanelUtils';

import AutomationForm from './AutomationForm';
import AutomationsListItem from './AutomationsListItem';
import { checkDuplicates } from './automationUtils';

interface AutomationsListProps {
  automations: Automation[];
  blueprints: NormalisedAutomationBlueprint;
}

export default function AutomationsList(props: AutomationsListProps) {
  const { automations, blueprints } = props;
  const [showForm, setShowForm] = useState(false);
  const { refetch } = useAutomationSettings();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteAutomation(id);
    } catch (error) {
      setDeleteError(maybeAxiosError(error));
    } finally {
      refetch();
    }
  };

  const postSubmit = () => {
    setShowForm(false);
    refetch();
  };

  const duplicates = useMemo(() => checkDuplicates(automations), [automations]);

  // there is no point letting user creating an automation if there are no blueprints
  const canAdd = Object.keys(blueprints).length > 0;

  return (
    <Panel.Card>
      <Panel.SubHeader>
        Manage automations
        <Button
          variant='ontime-subtle'
          rightIcon={<IoAdd />}
          size='sm'
          type='submit'
          form='automation-form'
          isDisabled={!canAdd}
          isLoading={false}
          onClick={() => setShowForm(true)}
        >
          New
        </Button>
      </Panel.SubHeader>
      <Panel.Divider />
      <Panel.Section>
        {duplicates && (
          <Panel.Error>
            You have created multiple links between the same trigger and blueprint which can performance issues.
          </Panel.Error>
        )}
        {showForm && (
          <AutomationForm blueprints={blueprints} onCancel={() => setShowForm(false)} postSubmit={postSubmit} />
        )}
        <Panel.Table>
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Title</th>
              <th style={{ width: '20%' }}>Trigger</th>
              <th style={{ width: '30%' }}>Blueprint</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!showForm && automations.length === 0 && (
              <Panel.TableEmpty
                label='Create a blueprint before adding automations'
                handleClick={canAdd ? () => setShowForm(true) : undefined}
              />
            )}
            {automations.map((automation, index) => {
              return (
                <Fragment key={automation.id}>
                  <AutomationsListItem
                    blueprints={blueprints}
                    id={automation.id}
                    title={automation.title}
                    trigger={automation.trigger}
                    blueprintId={automation.blueprintId}
                    duplicate={duplicates?.includes(index)}
                    handleDelete={() => handleDelete(automation.id)}
                    postSubmit={postSubmit}
                  />
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
      </Panel.Section>
    </Panel.Card>
  );
}
