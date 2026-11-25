import { Automation, AutomationDTO, NormalisedAutomation, TimerLifeCycle, Trigger } from 'ontime-types';
import { Fragment, type ReactElement, useState } from 'react';
import { IoAdd, IoPencil, IoTrash } from 'react-icons/io5';

import { deleteAutomation } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Dialog from '../../../../common/components/dialog/Dialog';
import { DropdownMenu } from '../../../../common/components/dropdown-menu/DropdownMenu';
import Info from '../../../../common/components/info/Info';
import Tag from '../../../../common/components/tag/Tag';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import { summariseOutputs } from '../../../../common/utils/automationOutputs';
import * as Panel from '../../panel-utils/PanelUtils';
import AutomationForm from './AutomationForm';
import RecipePicker from './RecipePicker';

import style from './AutomationsList.module.scss';

const automationPlaceholder: AutomationDTO = {
  title: '',
  filterRule: 'all',
  filters: [],
  outputs: [],
};

type FormState = {
  automation: Automation | AutomationDTO;
  trigger?: TimerLifeCycle;
};

interface AutomationsListProps {
  automations: NormalisedAutomation;
  triggers: Trigger[];
  enabledAutomations?: boolean;
  isLoading: boolean;
}

export default function AutomationsList({
  automations,
  triggers,
  enabledAutomations,
  isLoading,
}: AutomationsListProps) {
  const { refetch } = useAutomationSettings();
  const [formState, setFormState] = useState<FormState | null>(null);
  const [isPickingRecipe, setIsPickingRecipe] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeleteError(null);
      await deleteAutomation(id);
    } catch (error) {
      setDeleteError(maybeAxiosError(error));
    } finally {
      setDeleteId(null);
      refetch();
    }
  };

  const usedByCount = deleteId === null ? 0 : triggers.filter((trigger) => trigger.automationId === deleteId).length;

  const arrayAutomations = Object.keys(automations);

  const newAutomationMenu = (trigger: ReactElement, label = 'New') => (
    <DropdownMenu
      render={trigger}
      items={[
        { type: 'item', label: 'Blank', onClick: () => setFormState({ automation: automationPlaceholder }) },
        { type: 'item', label: 'From a recipe', onClick: () => setIsPickingRecipe(true) },
      ]}
    >
      {label} <IoAdd />
    </DropdownMenu>
  );

  return (
    <Panel.Section>
      <Panel.Card>
        {formState !== null && (
          <AutomationForm
            automation={formState.automation}
            trigger={formState.trigger}
            onClose={() => setFormState(null)}
          />
        )}
        {isPickingRecipe && (
          <RecipePicker
            onPick={(recipe) => {
              setIsPickingRecipe(false);
              setFormState(recipe);
            }}
            onClose={() => setIsPickingRecipe(false)}
          />
        )}
        <Panel.SubHeader>
          Automations
          {newAutomationMenu(<Button />)}
        </Panel.SubHeader>

        <Panel.Divider />

        <Panel.Section>
          {enabledAutomations === false && (
            <Info type='warning'>
              Automations are disabled. You can still manage them, but they won&apos;t run until enabled.
            </Info>
          )}

          <Panel.Table className={style.table}>
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Title</th>
                <th style={{ width: '15%' }}>Filter rule</th>
                <th style={{ width: '15%' }}>Filters</th>
                <th style={{ width: '15%' }}>Sends</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!isLoading && arrayAutomations.length === 0 && (
                <Panel.TableEmpty
                  title='No automations yet'
                  description='Create a reusable definition, then attach it to a global or an event trigger.'
                  action={newAutomationMenu(<Button variant='primary' />, 'Create automation')}
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
                      <td>
                        {automations[automationId].outputs.length === 0 ? (
                          <Tag variant='warning'>No outputs</Tag>
                        ) : (
                          summariseOutputs(automations[automationId].outputs).map(({ type, label, count }) => (
                            <Tag key={type}>{count > 1 ? `${label} ×${count}` : label}</Tag>
                          ))
                        )}
                      </td>
                      <Panel.InlineElements align='end' relation='inner' as='td'>
                        <IconButton
                          variant='ghosted-white'
                          aria-label='Edit entry'
                          onClick={() => setFormState({ automation: automations[automationId] })}
                        >
                          <IoPencil />
                        </IconButton>
                        <IconButton
                          variant='ghosted-destructive'
                          aria-label='Delete entry'
                          onClick={() => setDeleteId(automationId)}
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
      <Dialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title='Delete automation'
        showBackdrop
        showCloseButton
        bodyElements={
          usedByCount > 0
            ? `This automation is used by ${usedByCount} ${usedByCount === 1 ? 'trigger' : 'triggers'}. Remove or reassign them before deleting it.`
            : 'You will permanently remove this automation. Are you sure?'
        }
        footerElements={
          <>
            <Button size='large' onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              size='large'
              disabled={usedByCount > 0}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete automation
            </Button>
          </>
        }
      />
    </Panel.Section>
  );
}
