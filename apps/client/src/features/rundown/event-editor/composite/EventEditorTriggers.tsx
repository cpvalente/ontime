import { Fragment, useCallback, useState } from 'react';
import { IoAlertCircle, IoCheckmarkCircle, IoTrash } from 'react-icons/io5';
import { Button, IconButton, Select, Tooltip } from '@chakra-ui/react';
import { TimerLifeCycle, timerLifecycleValues, Trigger } from 'ontime-types';
import { generateId } from 'ontime-utils';

import Tag from '../../../../common/components/tag/Tag';
import { useEntryActions } from '../../../../common/hooks/useEntryAction';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';

import { eventTriggerOptions } from './eventTrigger.constants';

import style from './EventEditorTriggers.module.scss';

interface EventEditorTriggersProps {
  eventId: string;
  triggers: Trigger[];
}

export default function EventEditorTriggers(props: EventEditorTriggersProps) {
  const { triggers, eventId } = props;
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

function EventTriggerForm(props: EventTriggerFormProps) {
  const { eventId, triggers } = props;
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
        size='sm'
        variant='ontime'
        value={cycleValue}
        onChange={(e) => setCycleValue(e.target.value as TimerLifeCycle)}
      >
        <option disabled>Lifecycle Trigger</option>
        {eventTriggerOptions.map((cycle) => (
          <option key={cycle} value={cycle}>
            {cycle}
          </option>
        ))}
      </Select>
      <Select
        size='sm'
        variant='ontime'
        value={automationId}
        defaultValue='«invalid»'
        onChange={(e) => setAutomationId(e.target.value)}
      >
        <option disabled value='«invalid»'>
          Automation
        </option>
        {Object.values(automationSettings.automations).map(({ id, title }) => (
          <option key={id} value={id}>
            {title}
          </option>
        ))}
      </Select>
      <Button
        variant='ontime-subtle'
        size='sm'
        isDisabled={validationError !== undefined}
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

function ExistingEventTriggers(props: ExistingEventTriggersProps) {
  const { eventId, triggers } = props;
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
                <IconButton
                  size='sm'
                  variant='ontime-ghosted'
                  color='#FA5656' // $red-500
                  icon={<IoTrash />}
                  aria-label='Delete entry'
                  onClick={() => handleDelete(id)}
                />
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
