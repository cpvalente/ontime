import { Trigger } from 'ontime-types';
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

  // hide lifecycles where this row's automation is already used by another row
  const getLifecycleOptions = (triggerId: string, automationId: string) =>
    triggerOptions.filter(
      (opt) => !triggers.some((t) => t.id !== triggerId && t.trigger === opt.value && t.automationId === automationId),
    );

  // hide automations already used on the same lifecycle by other rows
  const getAutomationOptions = (triggerId: string, lifecycle: string) => {
    const usedIds = triggers.filter((t) => t.id !== triggerId && t.trigger === lifecycle).map((t) => t.automationId);
    return allAutomationOptions.filter((opt) => !usedIds.includes(opt.value));
  };

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
    if (!next) return;
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
    const newTriggers = triggers.map((t) => (t.id !== triggerId ? t : { ...t, [field]: value }));
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
                options={getLifecycleOptions(trigger.id, trigger.automationId)}
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
      {allAutomationOptions.length === 0 ? null : getNextAvailable() === null ? (
        <Editor.Label>All trigger and automation combinations are in use.</Editor.Label>
      ) : (
        <Button variant='ghosted' onClick={handleAdd}>
          <IoAdd /> Add automation
        </Button>
      )}
    </div>
  );
}
