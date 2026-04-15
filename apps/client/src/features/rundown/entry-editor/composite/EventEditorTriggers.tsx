import { TimerLifeCycle, Trigger, timerLifecycleValues } from 'ontime-types';
import { generateId } from 'ontime-utils';
import { Fragment, useCallback } from 'react';
import { IoAdd, IoTrash } from 'react-icons/io5';

import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import Info from '../../../../common/components/info/Info';
import Select from '../../../../common/components/select/Select';
import { useEntryActionsContext } from '../../../../common/context/EntryActionsContext';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import { eventTriggerOptions } from './eventTrigger.constants';

import style from './EventEditorTriggers.module.scss';

interface EventEditorTriggersProps {
  eventId: string;
  triggers: Trigger[];
}

export default function EventEditorTriggers({ triggers, eventId }: EventEditorTriggersProps) {
  const { data: automationSettings, status: automationStatus } = useAutomationSettings();
  const { updateEntry } = useEntryActionsContext();
  const automationsEnabled = automationStatus === 'pending' ? undefined : automationSettings.enabledAutomations;

  const automationIds = Object.keys(automationSettings.automations);
  const hasAutomations = automationIds.length > 0;

  const handleAdd = () => {
    const defaultLifecycle = TimerLifeCycle.onStart;
    const usedIds = triggers.filter((t) => t.trigger === defaultLifecycle).map((t) => t.automationId);
    const firstAvailable = automationIds.find((id) => !usedIds.includes(id));
    if (firstAvailable === undefined) return;
    const id = generateId();
    const newTrigger: Trigger = { id, title: '', trigger: defaultLifecycle, automationId: firstAvailable };
    updateEntry({ id: eventId, triggers: [...triggers, newTrigger] });
  };

  const handleDelete = useCallback(
    (triggerId: string) => {
      updateEntry({ id: eventId, triggers: triggers.filter((t) => t.id !== triggerId) });
    },
    [eventId, triggers, updateEntry],
  );

  const handleChange = useCallback(
    (triggerId: string, field: 'trigger' | 'automationId', value: string) => {
      const newTriggers = triggers.map((t) => (t.id === triggerId ? { ...t, [field]: value } : t));
      updateEntry({ id: eventId, triggers: newTriggers });
    },
    [eventId, triggers, updateEntry],
  );

  const triggerOptions = eventTriggerOptions.map((cycle) => ({ value: cycle, label: cycle }));

  const allAutomationOptions = Object.values(automationSettings.automations).map(({ id, title }) => ({
    value: id,
    label: title,
  }));

  const getAutomationOptionsForTrigger = (triggerId: string, lifecycle: TimerLifeCycle) => {
    const usedIds = triggers.filter((t) => t.id !== triggerId && t.trigger === lifecycle).map((t) => t.automationId);
    return allAutomationOptions.filter((opt) => !usedIds.includes(opt.value));
  };

  const filteredTriggers: Record<string, Trigger[]> = {};
  timerLifecycleValues.forEach((triggerType) => {
    const group = triggers.filter((t) => t.trigger === triggerType);
    if (group.length) {
      filteredTriggers[triggerType] = group;
    }
  });

  return (
    <div className={style.triggers}>
      {automationsEnabled === false && (
        <Info>Automations are disabled. Event triggers stay configured, but they will not run until enabled.</Info>
      )}
      {triggers.length > 0 && (
        <div className={style.triggerList}>
          <div className={style.triggerHeader}>
            <span>Lifecycle</span>
            <span>Automation</span>
          </div>
          {Object.entries(filteredTriggers).map(([triggerLifeCycle, triggerGroup]) => (
            <Fragment key={triggerLifeCycle}>
              {triggerGroup.map((trigger) => (
                <div key={trigger.id} className={style.trigger}>
                  <Select
                    value={trigger.trigger}
                    onValueChange={(value) => {
                      if (value !== null) handleChange(trigger.id, 'trigger', value);
                    }}
                    options={triggerOptions}
                  />
                  <Select
                    value={trigger.automationId}
                    onValueChange={(value) => {
                      if (value !== null) handleChange(trigger.id, 'automationId', value);
                    }}
                    options={getAutomationOptionsForTrigger(trigger.id, trigger.trigger)}
                  />
                  <IconButton variant='ghosted-destructive' onClick={() => handleDelete(trigger.id)}>
                    <IoTrash />
                  </IconButton>
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      )}
      {!hasAutomations ? (
        <Editor.Label>
          No automations defined. <a href='?settings=automation'>Manage automations</a> to add some.
        </Editor.Label>
      ) : (
        <Button
          variant='ghosted'
          onClick={handleAdd}
          disabled={automationIds.every((id) =>
            triggers.some((t) => t.trigger === TimerLifeCycle.onStart && t.automationId === id),
          )}
        >
          <IoAdd /> Add automation
        </Button>
      )}
    </div>
  );
}
