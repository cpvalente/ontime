import { AutomationDTO, NormalisedAutomation, TimerLifeCycle } from 'ontime-types';
import { Fragment, useState } from 'react';
import { IoAdd, IoPencil, IoTrash } from 'react-icons/io5';

import { deleteAutomation } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Info from '../../../../common/components/info/Info';
import Tag from '../../../../common/components/tag/Tag';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import useAutomationUsage from '../../../../common/hooks-query/useAutomationUsage';
import { summariseOutputs } from '../../../../common/utils/automationOutputs';
import * as Panel from '../../panel-utils/PanelUtils';
import AutomationForm from './AutomationForm';
import RecipeLibraryModal from './RecipeLibraryModal';

import style from './AutomationsList.module.scss';

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
  const { data: usage, refetch: refetchUsage } = useAutomationUsage();
  const [automationFormData, setAutomationFormData] = useState<AutomationDTO | null>(null);
  const [initialLifecycles, setInitialLifecycles] = useState<TimerLifeCycle[]>([]);
  const [isRecipeLibraryOpen, setIsRecipeLibraryOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeleteError(null);
      await deleteAutomation(id);
    } catch (error) {
      setDeleteError(maybeAxiosError(error));
    } finally {
      refetch();
      refetchUsage();
    }
  };

  const arrayAutomations = Object.keys(automations);

  return (
    <Panel.Section>
      <Panel.Card>
        {automationFormData !== null && (
          <AutomationForm
            automation={automationFormData}
            initialLifecycles={initialLifecycles}
            onClose={() => setAutomationFormData(null)}
          />
        )}
        {isRecipeLibraryOpen && (
          <RecipeLibraryModal
            onClose={() => setIsRecipeLibraryOpen(false)}
            onSelect={(automation, lifecycles) => {
              setInitialLifecycles(lifecycles);
              setAutomationFormData(automation);
              setIsRecipeLibraryOpen(false);
            }}
          />
        )}
        <Panel.SubHeader>
          Manage automations
          <Button
            onClick={() => {
              setInitialLifecycles([]);
              setAutomationFormData(automationPlaceholder);
            }}
          >
            New <IoAdd />
          </Button>
          <Button onClick={() => setIsRecipeLibraryOpen(true)}>Recipes</Button>
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
                <th style={{ width: '10%' }}>Usage</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!isLoading && arrayAutomations.length === 0 && (
                <Panel.TableEmpty
                  title='No automations yet'
                  description='Create a reusable definition, then attach it to a global or an event trigger.'
                  action={
                    <Button
                      variant='primary'
                      onClick={() => {
                        setInitialLifecycles([]);
                        setAutomationFormData(automationPlaceholder);
                      }}
                    >
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
                      <td>
                        {automations[automationId].outputs.length === 0 ? (
                          <Tag variant='warning'>No outputs</Tag>
                        ) : (
                          summariseOutputs(automations[automationId].outputs).map(({ type, label, count }) => (
                            <Tag key={type}>{count > 1 ? `${label} ×${count}` : label}</Tag>
                          ))
                        )}
                      </td>
                      <td>
                        {usage?.[automationId]
                          ? `${usage[automationId].global} global, ${usage[automationId].event} event`
                          : '—'}
                      </td>
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
                  <td colSpan={6}>
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
