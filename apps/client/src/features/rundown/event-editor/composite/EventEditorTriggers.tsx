import { Fragment, useCallback, useState } from 'react';
import { IoAddCircle, IoTrash } from 'react-icons/io5';
import { IconButton, Select, Tooltip } from '@chakra-ui/react';
import { TimerLifeCycle, timerLifecycleValues, Trigger } from 'ontime-types';
import { generateId } from 'ontime-utils';

import { useEventAction } from '../../../../common/hooks/useEventAction';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import * as Editor from '../../../editors/editor-utils/EditorUtils';

import { eventTriggerOptions } from './eventTrigger.constants';

import style from '../EventEditor.module.scss';

interface EventEditorTriggersProps {
  eventId: string;
  triggers?: Trigger[];
}

export default function EventEditorTriggers(props: EventEditorTriggersProps) {
  const { triggers, eventId } = props;
  const showTriggers = triggers !== undefined && triggers.length > 0;

  return (
    <Fragment>
      {showTriggers && <ExistingEventTriggers triggers={triggers} eventId={eventId} />}
      <EventTriggerForm triggers={triggers} eventId={eventId} />
    </Fragment>
  );
}

interface EventTriggerFormProps {
  eventId: string;
  triggers?: Trigger[];
}

function EventTriggerForm(props: EventTriggerFormProps) {
  const { eventId, triggers } = props;
  const { data: automationSettings } = useAutomationSettings();
  const { updateEvent } = useEventAction();
  const [automationId, setAutomationId] = useState<string | undefined>(undefined);
  const [cycleValue, setCycleValue] = useState(TimerLifeCycle.onStart);

  const handleSubmit = useCallback(
    (triggerLifeCycle: TimerLifeCycle, automationId: string) => {
      const newTriggers = triggers ?? new Array<Trigger>();
      const id = generateId();
      newTriggers.push({ id, title: '', trigger: triggerLifeCycle, automationId });
      updateEvent({ id: eventId, triggers: newTriggers });
    },
    [eventId, triggers, updateEvent],
  );

  const isInvalidTrigger = useCallback(
    (cycle: TimerLifeCycle, automationId?: string): false | string => {
      if (automationId === undefined) {
        return 'Select an automation';
      }
      if (!Object.keys(automationSettings.automations).includes(automationId)) {
        return 'This automation does not exist';
      }
      if (triggers === undefined) {
        return false;
      }
      return Object.values(triggers).some((t) => t.automationId === automationId && t.trigger === cycle)
        ? 'Automation can only be used once'
        : false;
    },
    [automationSettings.automations, triggers],
  );

  return (
    <div className={style.inline}>
      <Select
        size='sm'
        variant='ontime'
        value={automationId}
        defaultValue='default'
        onChange={(e) => setAutomationId(e.target.value)}
      >
        <option disabled value='default'>
          select an automation
        </option>
        {Object.values(automationSettings.automations).map(({ id, title }) => (
          <option key={id} value={id}>
            {title}
          </option>
        ))}
      </Select>
      <Select
        size='sm'
        variant='ontime'
        value={cycleValue}
        onChange={(e) => setCycleValue(e.target.value as TimerLifeCycle)}
        defaultValue={TimerLifeCycle.onStart}
      >
        {eventTriggerOptions.map((cycle) => (
          <option key={cycle} value={cycle}>
            {cycle}
          </option>
        ))}
      </Select>
      <Tooltip label={isInvalidTrigger(cycleValue, automationId)}>
        <IconButton
          isDisabled={Boolean(isInvalidTrigger(cycleValue, automationId))}
          onClick={() => automationId && handleSubmit(cycleValue, automationId)}
          size='sm'
          variant='ontime-ghosted'
          aria-label='Add entry'
          icon={<IoAddCircle />}
        />
      </Tooltip>
    </div>
  );
}

interface ExistingEventTriggersProps {
  eventId: string;
  triggers: Trigger[];
}

function ExistingEventTriggers(props: ExistingEventTriggersProps) {
  const { eventId, triggers } = props;
  const { updateEvent } = useEventAction();
  const { data: automationSettings } = useAutomationSettings();

  const handleDelete = useCallback(
    (triggerId: string) => {
      const newTriggers = triggers.filter((trigger) => trigger.id !== triggerId);
      updateEvent({ id: eventId, triggers: newTriggers });
    },
    [eventId, triggers, updateEvent],
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
          <Editor.Label className={style.decorated}>{triggerLifeCycle}</Editor.Label>
          {triggerGroup.map((trigger) => {
            const { id, automationId } = trigger;
            const automationTitle = automationSettings.automations[automationId]?.title ?? '<MISSING AUTOMATION>';
            return (
              <div key={id} className={style.trigger}>
                <span>→ {automationTitle}</span>
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
