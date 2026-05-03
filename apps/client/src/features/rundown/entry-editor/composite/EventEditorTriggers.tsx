import { Trigger } from 'ontime-types';
import { generateId } from 'ontime-utils';
import { IoAdd, IoTrash } from 'react-icons/io5';

import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
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

  const duplicateIds = new Set<string>();
  const seen = new Map<string, string>();
  for (const trigger of triggers) {
    const key = `${trigger.trigger}:${trigger.automationId}`;
    if (seen.has(key)) {
      duplicateIds.add(trigger.id);
    } else {
      seen.set(key, trigger.id);
    }
  }

  const handleAdd = () => {
    if (allAutomationOptions.length === 0) return;
    updateEntry({
      id: eventId,
      triggers: [
        ...triggers,
        { id: generateId(), title: '', trigger: eventTriggerOptions[0], automationId: allAutomationOptions[0].value },
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
          {triggers.map((trigger) => {
            const isDuplicate = duplicateIds.has(trigger.id);
            const lifecycleOptions = isDuplicate
              ? triggerOptions.map((opt) => (opt.value === trigger.trigger ? { ...opt, label: `${opt.label} *` } : opt))
              : triggerOptions;
            const automationOptions = isDuplicate
              ? allAutomationOptions.map((opt) =>
                  opt.value === trigger.automationId ? { ...opt, label: `${opt.label} *` } : opt,
                )
              : allAutomationOptions;
            return (
              <div key={trigger.id} className={style.trigger} data-duplicate={isDuplicate || undefined}>
                <Select
                  value={trigger.trigger}
                  onValueChange={(value) => {
                    if (value !== null) handleChange(trigger.id, 'trigger', value);
                  }}
                  options={lifecycleOptions}
                />
                <Select
                  value={trigger.automationId}
                  onValueChange={(value) => {
                    if (value !== null) handleChange(trigger.id, 'automationId', value);
                  }}
                  options={automationOptions}
                />
                <IconButton variant='ghosted-destructive' onClick={() => handleDelete(trigger.id)}>
                  <IoTrash />
                </IconButton>
              </div>
            );
          })}
        </div>
      )}
      {duplicateIds.size > 0 && (
        <span className={style.duplicateMessage}>
          * Duplicate combinations will only fire once per lifecycle event.
        </span>
      )}
      {allAutomationOptions.length > 0 && (
        <Button variant='ghosted' onClick={handleAdd}>
          <IoAdd /> Add automation
        </Button>
      )}
    </div>
  );
}
