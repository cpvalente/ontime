import { AutomationDTO, NormalisedAutomation, Trigger } from 'ontime-types';
import { Fragment, useMemo, useState } from 'react';
import { IoAdd, IoPencil, IoTrash } from 'react-icons/io5';

import { deleteAutomation } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Info from '../../../../common/components/info/Info';
import Tag from '../../../../common/components/tag/Tag';
import { getLifecycleLabel } from '../../../../common/constants/timerLifecycle';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import { summariseOutputs } from '../../../../common/utils/automationOutputs';
import * as Panel from '../../panel-utils/PanelUtils';
import AutomationForm from './AutomationForm';
import { groupTriggersByAutomation } from './automationUtils';

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

  const lifecyclesByAutomation = useMemo(() => groupTriggersByAutomation(triggers), [triggers]);

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
                <th style={{ width: '35%' }}>Title</th>
                <th style={{ width: '25%' }}>Runs on</th>
                <th style={{ width: '15%' }}>Filter rule</th>
                <th style={{ width: '15%' }}>Sends</th>
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
                      <Button variant='primary' onClick={() => setAutomationFormData(automationPlaceholder)}>
                        Create automation <IoAdd />
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
