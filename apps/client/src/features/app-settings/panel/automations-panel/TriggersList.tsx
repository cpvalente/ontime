import { NormalisedAutomation, Trigger } from 'ontime-types';
import { Fragment, useMemo, useState } from 'react';
import { IoAdd } from 'react-icons/io5';

import { deleteTrigger } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import * as Panel from '../../panel-utils/PanelUtils';
import useAppSettingsNavigation from '../../useAppSettingsNavigation';
import { checkDuplicates } from './automationUtils';
import TriggerForm from './TriggerForm';
import TriggersListItem from './TriggersListItem';

type FormState = {
  isOpen: boolean;
  trigger?: Trigger;
};

interface TriggersListProps {
  triggers: Trigger[];
  automations: NormalisedAutomation;
  enabledAutomations?: boolean;
  isLoading: boolean;
}

export default function TriggersList({ triggers, automations, enabledAutomations, isLoading }: TriggersListProps) {
  const [formState, setFormState] = useState<FormState>({ isOpen: false, trigger: undefined });
  const { refetch } = useAutomationSettings();
  const { setLocation } = useAppSettingsNavigation();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openNewForm = () => setFormState({ isOpen: true });
  const openEditForm = (trigger: Trigger) => setFormState({ isOpen: true, trigger });
  const closeForm = () => setFormState({ isOpen: false, trigger: undefined });

  const handleDelete = async (id: string) => {
    try {
      setDeleteError(null);
      await deleteTrigger(id);
    } catch (error) {
      setDeleteError(maybeAxiosError(error));
    } finally {
      refetch();
    }
  };

  const postSubmit = () => {
    closeForm();
    refetch();
  };

  const duplicates = useMemo(() => checkDuplicates(triggers), [triggers]);
  const orphans = useMemo(
    () => triggers.filter((trigger) => !Object.hasOwn(automations, trigger.automationId)).length,
    [triggers, automations],
  );

  // there is no point letting user creating a trigger if there are no automations
  const canAdd = Object.keys(automations).length > 0;

  return (
    <Panel.Section>
      <Panel.Card>
        {formState.isOpen && (
          <TriggerForm
            automations={automations}
            trigger={formState.trigger ?? null}
            onCancel={closeForm}
            postSubmit={postSubmit}
          />
        )}
        <Panel.SubHeader>
          Manage triggers
          <Button disabled={!canAdd} onClick={openNewForm}>
            New <IoAdd />
          </Button>
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          {enabledAutomations === false && (
            <Info>
              Automations are disabled. You can still manage triggers here, but they will not run until enabled.
            </Info>
          )}
          {duplicates && (
            <Panel.Error>
              You have created multiple links between the same trigger and automation. Duplicate combinations will only
              fire once per lifecycle event.
            </Panel.Error>
          )}
          {orphans > 0 && (
            <Panel.Error>
              {orphans === 1
                ? '1 trigger points at an automation that no longer exists and will never run.'
                : `${orphans} triggers point at automations that no longer exist and will never run.`}
            </Panel.Error>
          )}
          <Panel.Table>
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Title</th>
                <th style={{ width: '25%' }}>Lifecycle trigger</th>
                <th style={{ width: '25%' }}>Automation</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!isLoading && triggers.length === 0 && (
                <Panel.TableEmpty
                  title='No triggers yet'
                  description={
                    canAdd
                      ? 'Triggers run an automation at a given point of the timer lifecycle, like when an event starts or finishes.'
                      : 'Create an automation first, then add a trigger to decide when it should run.'
                  }
                  action={
                    canAdd ? (
                      <Button variant='primary' onClick={openNewForm}>
                        Create trigger <IoAdd />
                      </Button>
                    ) : (
                      <Button variant='primary' onClick={() => setLocation('automation__automations')}>
                        Go to automations
                      </Button>
                    )
                  }
                />
              )}
              {triggers.map((trigger, index) => {
                return (
                  <Fragment key={trigger.id}>
                    <TriggersListItem
                      automations={automations}
                      trigger={trigger}
                      duplicate={duplicates?.includes(index)}
                      handleEdit={() => openEditForm(trigger)}
                      handleDelete={() => handleDelete(trigger.id)}
                    />
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
