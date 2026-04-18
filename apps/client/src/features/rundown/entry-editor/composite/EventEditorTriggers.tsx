import { TimerLifeCycle, Trigger } from 'ontime-types';
import { generateId } from 'ontime-utils';
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

  const allAutomationOptions = Object.values(automationSettings.automations).map(({ id, title }) => ({
    value: id,
    label: title,
  }));

  const triggerOptions = eventTriggerOptions.map((cycle) => ({ value: cycle, label: cycle }));

  // returns automation options for a row, excluding automations already used on the same lifecycle
  const getAutomationOptions = (triggerId: string, lifecycle: TimerLifeCycle) => {
    const usedIds = triggers.filter((t) => t.id !== triggerId && t.trigger === lifecycle).map((t) => t.automationId);
    return allAutomationOptions.filter((opt) => !usedIds.includes(opt.value));
  };

  // returns the first lifecycle+automation pair not yet in use, or null if all are taken
  const getNextAvailable = () => {
    for (const lifecycle of eventTriggerOptions) {
      const usedIds = triggers.filter((t) => t.trigger === lifecycle).map((t) => t.automationId);
      const automation = allAutomationOptions.find((opt) => !usedIds.includes(opt.value));
      if (automation) return { lifecycle, automationId: automation.value };
    }
    return null;
  };

  const handleAdd = () => {
    const next = getNextAvailable();
    if (next === null) return;
    updateEntry({
      id: eventId,
      triggers: [
        ...triggers,
        { id: generateId(), title: '', trigger: next.lifecycle, automationId: next.automationId },
      ],
    });
  };

  const handleDelete = (triggerId: string) => {
    updateEntry({ id: eventId, triggers: triggers.filter((t) => t.id !== triggerId) });
  };

  const handleChange = (triggerId: string, field: 'trigger' | 'automationId', value: string) => {
    const newTriggers = triggers.map((t) => {
      if (t.id !== triggerId) return t;
      const updated = { ...t, [field]: value };
      // when lifecycle changes, auto-resolve automationId if it now conflicts with another row
      if (field === 'trigger') {
        const newLifecycle = value as TimerLifeCycle;
        const isConflict = triggers.some(
          (other) => other.id !== triggerId && other.trigger === newLifecycle && other.automationId === t.automationId,
        );
        if (isConflict) {
          const usedIds = triggers
            .filter((other) => other.id !== triggerId && other.trigger === newLifecycle)
            .map((other) => other.automationId);
          const fallback = allAutomationOptions.find((opt) => !usedIds.includes(opt.value));
          // no available automation for this lifecycle — reject the change
          if (!fallback) return t;
          updated.automationId = fallback.value;
        }
      }
      return updated;
    });
    updateEntry({ id: eventId, triggers: newTriggers });
  };

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
          {triggers.map((trigger) => (
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
                options={getAutomationOptions(trigger.id, trigger.trigger)}
              />
              <IconButton variant='ghosted-destructive' onClick={() => handleDelete(trigger.id)}>
                <IoTrash />
              </IconButton>
            </div>
          ))}
        </div>
      )}
      {allAutomationOptions.length === 0 ? (
        <Editor.Label>
          No automations defined. <a href='?settings=automation'>Manage automations</a> to add some.
        </Editor.Label>
      ) : (
        <Button variant='ghosted' onClick={handleAdd} disabled={getNextAvailable() === null}>
          <IoAdd /> Add automation
        </Button>
      )}
    </div>
  );
}
