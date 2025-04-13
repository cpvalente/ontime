import { Fragment, useCallback, useState } from 'react';
import { IoAddCircle, IoTrash } from 'react-icons/io5';
import { IconButton, Select, Tooltip } from '@chakra-ui/react';
import { TimerLifeCycle, timerLifecycleValues, TriggerDTO } from 'ontime-types';

import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import * as Editor from '../../../editors/editor-utils/EditorUtils';
import { EditorUpdateFields } from '../EventEditor';

import style from '../EventEditor.module.scss';

type EventTriggers = Record<string, TriggerDTO>;

interface EventTriggersProps {
  triggers?: EventTriggers;
  handleSubmit: (field: EditorUpdateFields, value: string) => void;
}

export default function EventTriggers(props: EventTriggersProps) {
  const { triggers, handleSubmit } = props;

  return (
    <>
      {triggers !== undefined && <ExistingEventTriggers triggers={triggers} handleSubmit={handleSubmit} />}
      <EventTriggerForm handleSubmit={handleSubmit} triggers={triggers} />
    </>
  );
}

interface EventTriggerFormProps {
  handleSubmit: (field: EditorUpdateFields, value: string) => void;
  triggers?: EventTriggers;
}

function EventTriggerForm(props: EventTriggerFormProps) {
  const { handleSubmit, triggers } = props;
  const { data: automationSettings } = useAutomationSettings();
  const [automationId, setAutomationId] = useState<string | undefined>(undefined);
  const [cycleValue, setCycleValue] = useState(TimerLifeCycle.onStart);

  const isInvalidTrigger = useCallback(
    (cycle: TimerLifeCycle, automationId?: string): false | string => {
      if (automationId === undefined) {
        return 'Select an automation';
      }
      if (!Object.keys(automationSettings.automations).includes(automationId)) {
        return 'This automation dose not exist';
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
        {/* Notice here that we don't support onStop */}
        {['onLoad', 'onStart', 'onPause', 'onFinish', 'onWarning', 'onDanger'].map((cycle) => (
          <option key={cycle} value={cycle}>
            {cycle}
          </option>
        ))}
      </Select>
      <Tooltip label={isInvalidTrigger(cycleValue, automationId)}>
        <IconButton
          isDisabled={isInvalidTrigger(cycleValue, automationId) ? true : false}
          onClick={() => handleSubmit(`trigger-${automationId}`, cycleValue)}
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
  triggers: EventTriggers;
  handleSubmit: (field: EditorUpdateFields, value: string) => void;
}

function ExistingEventTriggers(props: ExistingEventTriggersProps) {
  const { handleSubmit, triggers } = props;
  const { data: automationSettings } = useAutomationSettings();

  const filteredTriggers: Record<string, EventTriggers> = {};

  timerLifecycleValues.forEach((triggerType) => {
    const thisTriggerType = Object.entries(triggers).filter(([_id, value]) => value.trigger === triggerType);

    if (thisTriggerType.length > 0) {
      Object.assign(filteredTriggers, { [triggerType]: {} });
      thisTriggerType.forEach(([id, value]) => Object.assign(filteredTriggers[triggerType], { [id]: value }));
    }
  });

  return (
    <div>
      {Object.entries(filteredTriggers)
        .filter(([_, group]) => group !== undefined)
        .map(([triggerLifeCycle, triggerGroup]) => (
          <Fragment key={triggerLifeCycle}>
            <Editor.Label className={style.decorated}>{triggerLifeCycle}</Editor.Label>
            {Object.entries(triggerGroup).map(([id, trigger]) => {
              const { automationId } = trigger;
              const automationTitle = automationSettings.automations[automationId]?.title ?? '<MISSING AUTOMATION>';
              return (
                <div key={id} className={style.trigger}>
                  <span>🠆 {automationTitle}</span>
                  <IconButton
                    size='sm'
                    variant='ontime-ghosted'
                    color='#FA5656' // $red-500
                    icon={<IoTrash />}
                    aria-label='Delete entry'
                    onClick={() => handleSubmit(`trigger-${id}`, '')}
                  />
                </div>
              );
            })}
          </Fragment>
        ))}
    </div>
  );
}
