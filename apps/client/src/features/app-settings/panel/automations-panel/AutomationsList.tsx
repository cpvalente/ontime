import { Automation, AutomationDTO, NormalisedAutomation, Trigger } from 'ontime-types';
import { useMemo, useState } from 'react';
import { IoAdd, IoPencil, IoTrash } from 'react-icons/io5';

import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Info from '../../../../common/components/info/Info';
import Tag from '../../../../common/components/tag/Tag';
import { getLifecycleLabel } from '../../../../common/constants/timerLifecycle';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import { summariseOutputs } from '../../../../common/utils/automationOutputs';
import { cx } from '../../../../common/utils/styleUtils';
import * as Panel from '../../panel-utils/PanelUtils';
import useAppSettingsNavigation from '../../useAppSettingsNavigation';
import AutomationForm from './AutomationForm';
import { groupTriggersByAutomation, isAutomation } from './automationUtils';
import DeleteAutomationDialog from './DeleteAutomationDialog';
import NewAutomationDialog from './NewAutomationDialog';

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
  const { setLocation } = useAppSettingsNavigation();
  const [editing, setEditing] = useState<Automation | AutomationDTO | null>(null);
  const [isPickingStart, setIsPickingStart] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);

  const lifecyclesByAutomation = useMemo(() => groupTriggersByAutomation(triggers), [triggers]);
  const automationList = Object.values(automations);

  /** a recipe creates the automation itself, so it lands in the list rather than in a form */
  const handleCreated = async () => {
    setIsPickingStart(false);
    await refetch();
  };

  const handleStartEmpty = () => {
    setIsPickingStart(false);
    setDeleteTarget(null);
    setEditing(emptyAutomation);
  };

  const handleDeleted = async () => {
    setDeleteTarget(null);
    setEditing(null);
    await refetch();
  };

  const startPicking = () => {
    setEditing(null);
    setDeleteTarget(null);
    setIsPickingStart(true);
  };

  const startEditing = (automation: Automation) => {
    setIsPickingStart(false);
    setDeleteTarget(null);
    setEditing(automation);
  };

  const startDeleting = (automation: Automation) => {
    setIsPickingStart(false);
    setEditing(null);
    setDeleteTarget(automation);
  };

  return (
    <Panel.Section>
      <Panel.Card>
        {editing !== null && (
          <AutomationForm
            // the form snapshots the automation's lifecycles on mount, so it must never be
            // reused across two different automations
            key={isAutomation(editing) ? editing.id : 'new'}
            automation={editing}
            triggers={triggers}
            onClose={() => setEditing(null)}
          />
        )}
        {isPickingStart && (
          <NewAutomationDialog
            onClose={() => setIsPickingStart(false)}
            onStartEmpty={handleStartEmpty}
            onCreated={handleCreated}
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
          <Button onClick={startPicking}>
            New <IoAdd />
          </Button>
        </Panel.SubHeader>

        <Panel.Divider />

        <Panel.Section>
          {enabledAutomations === false && (
            <Info type='warning'>
              <Info.Body>Automations are off, so nothing in this list will run.</Info.Body>
              <Info.Footer>
                <Button size='small' onClick={() => setLocation('automation__settings')}>
                  Go to automation settings
                </Button>
              </Info.Footer>
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
              {!isLoading && automationList.length === 0 && (
                <Panel.TableEmpty
                  title='No automations yet'
                  description='An automation sends OSC or HTTP messages, or runs an Ontime action, whenever a trigger fires. Start from a recipe to see one working.'
                  action={
                    <Button variant='primary' onClick={startPicking}>
                      New automation <IoAdd />
                    </Button>
                  }
                />
              )}
              {automationList.map((automation) => {
                const lifecycles = lifecyclesByAutomation[automation.id] ?? [];
                const outputs = summariseOutputs(automation.outputs);

                return (
                  <tr key={automation.id}>
                    <td>{automation.title}</td>
                    <td>
                      {lifecycles.length === 0 ? (
                        <span className={style.muted}>—</span>
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
                          onClick={() => startEditing(automation)}
                        >
                          <IoPencil />
                        </IconButton>
                        <IconButton
                          variant='ghosted-destructive'
                          aria-label='Delete entry'
                          onClick={() => startDeleting(automation)}
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
