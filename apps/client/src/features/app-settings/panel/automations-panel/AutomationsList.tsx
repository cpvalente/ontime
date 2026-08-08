import { Automation, AutomationDTO, NormalisedAutomation, Trigger } from 'ontime-types';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { IoAdd, IoPencil, IoSparklesOutline, IoTrash } from 'react-icons/io5';

import { deleteAutomation } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Info from '../../../../common/components/info/Info';
import Tag from '../../../../common/components/tag/Tag';
import { getLifecycleLabel } from '../../../../common/constants/timerLifecycle';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import { useAutomationFired } from '../../../../common/stores/automationFired';
import { summariseOutputs } from '../../../../common/utils/automationOutputs';
import * as Panel from '../../panel-utils/PanelUtils';
import AutomationForm from './AutomationForm';
import { groupTriggersByAutomation } from './automationUtils';
import RecipeLibraryModal from './recipes/RecipeLibraryModal';

import style from './AutomationsList.module.scss';

const automationPlaceholder: AutomationDTO = {
  title: '',
  filterRule: 'all',
  filters: [],
  outputs: [],
};

interface AutomationsListProps {
  automations: NormalisedAutomation;
  triggers: Trigger[];
  enabledAutomations?: boolean;
  isLoading: boolean;
}

export default function AutomationsList({ automations, triggers, enabledAutomations, isLoading }: AutomationsListProps) {
  const { refetch } = useAutomationSettings();
  const [automationFormData, setAutomationFormData] = useState<AutomationDTO | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * A recipe lands in the editor rather than only in the list.
   * Seeing it as an editable automation is the point, and recipes with an
   * external target are unusable until the user changes it anyway.
   */
  const handleRecipeInstalled = async (created: Automation) => {
    setShowRecipes(false);
    await refetch();
    setAutomationFormData(created);
  };

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

  const lifecyclesByAutomation = useMemo(() => groupTriggersByAutomation(triggers), [triggers]);
  const { fired } = useAutomationFired();

  const arrayAutomations = Object.keys(automations);

  return (
    <Panel.Section>
      <Panel.Card>
        {automationFormData !== null && (
          <AutomationForm
            automation={automationFormData}
            triggers={triggers}
            onClose={() => setAutomationFormData(null)}
          />
        )}
        {showRecipes && (
          <RecipeLibraryModal
            onClose={() => setShowRecipes(false)}
            onInstalled={(_recipe, created) => handleRecipeInstalled(created)}
          />
        )}
        <Panel.SubHeader>
          Manage automations
          <Panel.InlineElements relation='inner'>
            <Button onClick={() => setShowRecipes(true)}>
              Browse recipes <IoSparklesOutline />
            </Button>
            <Button onClick={() => setAutomationFormData(automationPlaceholder)}>
              New <IoAdd />
            </Button>
          </Panel.InlineElements>
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
                <th style={{ width: '30%' }}>Title</th>
                <th style={{ width: '22%' }}>Runs on</th>
                <th style={{ width: '13%' }}>Filter rule</th>
                <th style={{ width: '15%' }}>Sends</th>
                <th style={{ width: '12%' }}>Last fired</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!isLoading && arrayAutomations.length === 0 && (
                <Panel.TableEmpty
                  title='No automations yet'
                  description='An automation sends OSC or HTTP messages, or runs an Ontime action, whenever a trigger fires.'
                  action={
                    <Panel.InlineElements relation='inner'>
                      <Button variant='primary' onClick={() => setShowRecipes(true)}>
                        Browse recipes <IoSparklesOutline />
                      </Button>
                      <Button onClick={() => setAutomationFormData(automationPlaceholder)}>
                        Create from scratch <IoAdd />
                      </Button>
                    </Panel.InlineElements>
                  }
                />
              )}
              {arrayAutomations.map((automationId) => {
                if (!Object.hasOwn(automations, automationId)) {
                  return null;
                }
                const automation = automations[automationId];
                const lifecycles = lifecyclesByAutomation[automationId] ?? [];
                const outputs = summariseOutputs(automation.outputs);

                return (
                  <Fragment key={automationId}>
                    <tr>
                      <td>{automation.title}</td>
                      <Panel.InlineElements as='td' relation='inner' wrap='wrap'>
                        {lifecycles.length === 0 ? (
                          <Tag variant='warning'>Never runs</Tag>
                        ) : (
                          lifecycles.map((cycle) => <Tag key={cycle}>{getLifecycleLabel(cycle)}</Tag>)
                        )}
                      </Panel.InlineElements>
                      <td>
                        {automation.filters.length === 0 ? (
                          <span className={style.muted}>—</span>
                        ) : (
                          <Tag>{automation.filterRule === 'all' ? 'All filters' : 'Any filter'}</Tag>
                        )}
                      </td>
                      <Panel.InlineElements as='td' relation='inner' wrap='wrap'>
                        {outputs.length === 0 ? (
                          <Tag variant='warning'>No outputs</Tag>
                        ) : (
                          outputs.map(({ type, label, count }) => (
                            <Tag key={type}>{count > 1 ? `${label} ×${count}` : label}</Tag>
                          ))
                        )}
                      </Panel.InlineElements>
                      <td>
                        <LastFired at={fired[automationId]?.at} />
                      </td>
                      <Panel.InlineElements align='end' relation='inner' as='td'>
                        <IconButton
                          variant='ghosted-white'
                          aria-label='Edit entry'
                          onClick={() => setAutomationFormData(automation)}
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

/**
 * Shows how long ago an automation last ran.
 * An automation that never ticks while its neighbours do is the clearest signal
 * that something upstream of it, a filter or a trigger, is wrong
 */
function LastFired({ at }: { at?: number }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (at === undefined) {
      return;
    }
    const interval = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [at]);

  if (at === undefined) {
    return <span className={style.muted}>—</span>;
  }

  return <span className={style.lastFired}>{formatElapsed(Date.now() - at)}</span>;
}

function formatElapsed(elapsed: number): string {
  const seconds = Math.max(0, Math.floor(elapsed / 1000));
  if (seconds < 5) {
    return 'just now';
  }
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  return `${Math.floor(minutes / 60)}h ago`;
}
