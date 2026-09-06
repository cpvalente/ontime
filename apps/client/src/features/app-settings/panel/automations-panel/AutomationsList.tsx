import { Automation, AutomationDTO, NormalisedAutomation, Trigger } from 'ontime-types';
import { useMemo, useState } from 'react';
import { IoAdd, IoPencil, IoSparkles, IoTrash } from 'react-icons/io5';

import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Info from '../../../../common/components/info/Info';
import Tag from '../../../../common/components/tag/Tag';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import { cx } from '../../../../common/utils/styleUtils';
import * as Panel from '../../panel-utils/PanelUtils';
import AutomationForm from './AutomationForm';
import { summariseOutputs } from './automationOutputs';
import { groupTriggersByAutomation, isAutomation } from './automationUtils';
import DeleteAutomationDialog from './DeleteAutomationDialog';
import NewAutomationDialog from './NewAutomationDialog';
import { getLifecycleLabel } from './timerLifecycle';
import TriggerForm from './TriggerForm';

import style from './AutomationsList.module.scss';

const emptyAutomation: AutomationDTO = {
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

export default function AutomationsList({
  automations,
  triggers,
  enabledAutomations,
  isLoading,
}: AutomationsListProps) {
  const { refetch } = useAutomationSettings();
  const [editing, setEditing] = useState<Automation | AutomationDTO | null>(null);
  const [isPickingRecipe, setIsPickingRecipe] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);
  /** the automation a new global trigger should point at, set from the row that asked for it */
  const [triggerTarget, setTriggerTarget] = useState<Automation | null>(null);

  const lifecyclesByAutomation = useMemo(() => groupTriggersByAutomation(triggers), [triggers]);
  const automationIds = Object.keys(automations);

  /** a recipe creates the automation itself, so it lands in the list rather than in a form */
  const handleCreated = async () => {
    setIsPickingRecipe(false);
    await refetch();
  };

  const handleDeleted = async () => {
    setDeleteTarget(null);
    await refetch();
  };

  const handleTriggerCreated = async () => {
    setTriggerTarget(null);
    await refetch();
  };

  return (
    <Panel.Section>
      <Panel.Card>
        {editing !== null && (
          <AutomationForm
            // the form seeds itself from the automation once, so it must never be reused across two of them
            key={isAutomation(editing) ? editing.id : 'new'}
            automation={editing}
            onClose={() => setEditing(null)}
          />
        )}
        {isPickingRecipe && <NewAutomationDialog onClose={() => setIsPickingRecipe(false)} onCreated={handleCreated} />}
        {triggerTarget !== null && (
          <TriggerForm
            automations={automations}
            trigger={null}
            automationId={triggerTarget.id}
            onCancel={() => setTriggerTarget(null)}
            postSubmit={handleTriggerCreated}
          />
        )}
        {deleteTarget !== null && (
          <DeleteAutomationDialog
            automation={deleteTarget}
            attachedTriggers={triggers.filter((trigger) => trigger.automationId === deleteTarget.id)}
            onCancel={() => setDeleteTarget(null)}
            onDeleted={handleDeleted}
          />
        )}
        <Panel.SubHeader>
          Manage automations
          <Panel.InlineElements>
            <Button onClick={() => setIsPickingRecipe(true)}>
              Start from recipe <IoSparkles />
            </Button>
            <Button onClick={() => setEditing(emptyAutomation)}>
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

          <Panel.Table className={style.table}>
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Title</th>
                <th style={{ width: '25%' }}>Runs on</th>
                <th style={{ width: '15%' }}>Filter rule</th>
                <th style={{ width: '15%' }}>Sends</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!isLoading && automationIds.length === 0 && (
                <Panel.TableEmpty
                  title='No automations yet'
                  description='An automation sends OSC or HTTP messages, or runs an Ontime action, whenever a trigger fires. A recipe fills one in for a known workflow, like a video switcher or a chat channel.'
                  action={
                    <Panel.InlineElements>
                      <Button variant='primary' onClick={() => setIsPickingRecipe(true)}>
                        Start from recipe <IoSparkles />
                      </Button>
                      <Button onClick={() => setEditing(emptyAutomation)}>
                        New automation <IoAdd />
                      </Button>
                    </Panel.InlineElements>
                  }
                />
              )}
              {automationIds.map((automationId) => {
                const automation = automations[automationId];
                const lifecycles = lifecyclesByAutomation[automationId] ?? [];
                const outputs = summariseOutputs(automation.outputs);

                return (
                  <tr key={automationId}>
                    <td>{automation.title}</td>
                    <td>
                      {/*
                       * Only global triggers are listed here: an automation can also be attached to
                       * single events, which live in the rundown. No global trigger therefore does not
                       * mean it never runs, so the cell offers to add one rather than claiming anything.
                       */}
                      {lifecycles.length === 0 ? (
                        <Button size='small' variant='subtle' onClick={() => setTriggerTarget(automation)}>
                          Add trigger <IoAdd />
                        </Button>
                      ) : (
                        <div className={style.tags}>
                          {lifecycles.map((cycle) => (
                            <Tag key={cycle}>{getLifecycleLabel(cycle)}</Tag>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {automation.filters.length === 0 ? (
                        <span className={style.muted}>—</span>
                      ) : (
                        <Tag>{automation.filterRule === 'all' ? 'All filters' : 'Any filter'}</Tag>
                      )}
                    </td>
                    <td>
                      <div className={style.tags}>
                        {outputs.length === 0 ? (
                          <Tag variant='warning'>No outputs</Tag>
                        ) : (
                          outputs.map(({ type, label, count }) => (
                            <Tag key={type}>{count > 1 ? `${label} ×${count}` : label}</Tag>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={cx([style.tags, style.actions])}>
                        <IconButton
                          variant='ghosted-white'
                          aria-label='Edit entry'
                          onClick={() => setEditing(automation)}
                        >
                          <IoPencil />
                        </IconButton>
                        <IconButton
                          variant='ghosted-destructive'
                          aria-label='Delete entry'
                          onClick={() => setDeleteTarget(automation)}
                        >
                          <IoTrash />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Panel.Table>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
