import { Fragment, useCallback, useState } from 'react';
import { IoAlertCircle, IoCheckmarkCircle, IoTrash } from 'react-icons/io5';
import { Tooltip } from '@chakra-ui/react';
import { TimerLifeCycle, timerLifecycleValues, Trigger } from 'ontime-types';
import { generateId } from 'ontime-utils';

import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Select from '../../../../common/components/select/Select';
import Tag from '../../../../common/components/tag/Tag';
import { useEntryActions } from '../../../../common/hooks/useEntryAction';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';

import { eventTriggerOptions } from './eventTrigger.constants';

import style from './EventEditorTriggers.module.scss';

interface EventEditorTriggersProps {
  eventId: string;
  triggers: Trigger[];
}

export default function EventEditorTriggers({ triggers, eventId }: EventEditorTriggersProps) {
  const showTriggers = triggers.length > 0;

  return (
    <>
      {showTriggers && <ExistingEventTriggers triggers={triggers} eventId={eventId} />}
      <EventTriggerForm triggers={triggers} eventId={eventId} />
    </>
  );
}

interface EventTriggerFormProps {
  eventId: string;
  triggers?: Trigger[];
}

function EventTriggerForm({ eventId, triggers }: EventTriggerFormProps) {
  const { data: automationSettings } = useAutomationSettings();
  const { updateEntry } = useEntryActions();
  const [automationId, setAutomationId] = useState<string | undefined>(undefined);
  const [cycleValue, setCycleValue] = useState(TimerLifeCycle.onStart);

  const handleSubmit = (triggerLifeCycle: TimerLifeCycle, automationId: string) => {
    const newTriggers = triggers ?? new Array<Trigger>();
    const id = generateId();
    newTriggers.push({ id, title: '', trigger: triggerLifeCycle, automationId });
    updateEntry({ id: eventId, triggers: newTriggers });
  };

  const getValidationError = (cycle: TimerLifeCycle, automationId?: string): string | undefined => {
    if (automationId === undefined) {
      return 'Select an automation';
    }
    if (!Object.keys(automationSettings.automations).includes(automationId)) {
      return 'This automation does not exist';
    }
    if (triggers === undefined) {
      return;
    }
    return Object.values(triggers).some((t) => t.automationId === automationId && t.trigger === cycle)
      ? 'Automation can only be used once'
      : undefined;
  };

  const validationError = getValidationError(cycleValue, automationId);

  return (
    <div className={style.triggerForm}>
      <Select
        value={cycleValue}
        placeholder='Choose a trigger'
        onChange={(value) => setCycleValue(value)}
        options={eventTriggerOptions.map((cycle) => ({ value: cycle, label: cycle }))}
      />

      <Select
        value={automationId}
        placeholder='Choose an automation'
        onChange={(value) => setAutomationId(value)}
        options={Object.values(automationSettings.automations).map(({ id, title }) => ({ value: id, label: title }))}
      />

      <Button
        disabled={validationError !== undefined}
        onClick={() => automationId && handleSubmit(cycleValue, automationId)}
      >
        Add
      </Button>
      {validationError !== undefined ? (
        <Tooltip label={validationError} shouldWrapChildren>
          <IoAlertCircle className={style.errorLabel} />
        </Tooltip>
      ) : (
        <IoCheckmarkCircle className={style.success} />
      )}
    </div>
  );
}

interface ExistingEventTriggersProps {
  eventId: string;
  triggers: Trigger[];
}

function ExistingEventTriggers({ eventId, triggers }: ExistingEventTriggersProps) {
  const { updateEntry } = useEntryActions();
  const { data: automationSettings } = useAutomationSettings();

  const handleDelete = useCallback(
    (triggerId: string) => {
      const newTriggers = triggers.filter((trigger) => trigger.id !== triggerId);
      updateEntry({ id: eventId, triggers: newTriggers });
    },
    [eventId, triggers, updateEntry],
  );

  const filteredTriggers: Record<string, Trigger[]> = {};

  // sort triggers out into groups by the Lifecycle they are on
  timerLifecycleValues.forEach((triggerType) => {
    const thisTriggerType = triggers.filter((trigger) => trigger.trigger === triggerType);
    if (thisTriggerType.length) {
      Object.assign(filteredTriggers, { [triggerType]: thisTriggerType });
    }
  });

  return (
    <div>
      {Object.entries(filteredTriggers).map(([triggerLifeCycle, triggerGroup]) => (
        <Fragment key={triggerLifeCycle}>
          {triggerGroup.map((trigger) => {
            const { id, automationId } = trigger;
            const automationTitle = automationSettings.automations[automationId]?.title ?? '<MISSING AUTOMATION>';
            return (
              <div key={id} className={style.trigger}>
                <Tag>{triggerLifeCycle}</Tag>
                <Tag>{automationTitle}</Tag>
                <IconButton variant='subtle-destructive' onClick={() => handleDelete(id)}>
                  <IoTrash />
                </IconButton>
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
