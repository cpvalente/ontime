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

  const handleAdd = () => {
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
                options={allAutomationOptions}
              />
              <IconButton variant='ghosted-destructive' onClick={() => handleDelete(trigger.id)}>
                <IoTrash />
              </IconButton>
            </div>
          ))}
        </div>
      )}
      {allAutomationOptions.length === 0 ? (
        <Editor.Label>No automations defined.</Editor.Label>
      ) : (
        <Button variant='ghosted' onClick={handleAdd}>
          <IoAdd /> Add automation
        </Button>
      )}
    </div>
  );
}
