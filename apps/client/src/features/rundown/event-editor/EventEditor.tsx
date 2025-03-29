import { CSSProperties, useCallback, useState } from 'react';
import { IoAddCircle } from 'react-icons/io5';
import { IconButton, Select } from '@chakra-ui/react';
import { CustomFieldLabel, OntimeEvent, TimerLifeCycle, Trigger } from 'ontime-types';
import { generateId } from 'ontime-utils';

import AppLink from '../../../common/components/link/app-link/AppLink';
import { useEventAction } from '../../../common/hooks/useEventAction';
import useAutomationSettings from '../../../common/hooks-query/useAutomationSettings';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import { getAccessibleColour } from '../../../common/utils/styleUtils';
import * as Editor from '../../editors/editor-utils/EditorUtils';

import EventEditorImage from './composite/EventEditorImage';
import EventEditorTimes from './composite/EventEditorTimes';
import EventEditorTitles from './composite/EventEditorTitles';
import EventTextArea from './composite/EventTextArea';
import EventTextInput from './composite/EventTextInput';
import EventTriggers from './composite/EventTriggers';
import EventEditorEmpty from './EventEditorEmpty';

import style from './EventEditor.module.scss';

export type EventEditorSubmitActions = keyof OntimeEvent;

export type EditorUpdateFields = 'cue' | 'title' | 'note' | 'colour' | CustomFieldLabel;

interface EventEditorProps {
  event: OntimeEvent;
}

export default function EventEditor(props: EventEditorProps) {
  const { event } = props;
  const { data: customFields } = useCustomFields();
  const { updateEvent } = useEventAction();
  const { data: automationSettings } = useAutomationSettings();

  const [newTriggerValue, setNewTriggerValue] = useState({
    id: automationSettings.automations[0]?.id ?? '',
    cycle: TimerLifeCycle.onStart,
  });

  const isEditor = window.location.pathname.includes('editor');

  const handleSubmit = useCallback(
    (field: EditorUpdateFields, value: string) => {
      if (field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        updateEvent({ id: event?.id, custom: { [fieldLabel]: value } });
      } else {
        updateEvent({ id: event?.id, [field]: value });
      }
    },
    [event?.id, updateEvent],
  );

  const submitTrigger = useCallback(
    (value: typeof newTriggerValue) => {
      const triggers = event.triggers ?? new Array<Trigger>();
      const id = generateId();
      triggers.push({ title: '', id, trigger: value.cycle, automationId: value.id });
      updateEvent({ id: event?.id, triggers: triggers });
    },
    [event?.id, event.triggers, updateEvent],
  );

  const deleteTrigger = useCallback(
    (id: string) => {
      if (event.triggers) {
        const newTriggerList = event.triggers.filter((value) => value.id !== id);
        updateEvent({ id: event?.id, triggers: newTriggerList });
      }
    },
    [event?.id, event.triggers, updateEvent],
  );

  if (!event) {
    return <EventEditorEmpty />;
  }

  return (
    <div className={style.content}>
      <EventEditorTimes
        key={`${event.id}-times`}
        eventId={event.id}
        timeStart={event.timeStart}
        timeEnd={event.timeEnd}
        duration={event.duration}
        timeStrategy={event.timeStrategy}
        linkStart={event.linkStart}
        countToEnd={event.countToEnd}
        delay={event.delay ?? 0}
        isPublic={event.isPublic}
        endAction={event.endAction}
        timerType={event.timerType}
        timeWarning={event.timeWarning}
        timeDanger={event.timeDanger}
      />
      <EventEditorTitles
        key={`${event.id}-titles`}
        eventId={event.id}
        cue={event.cue}
        title={event.title}
        note={event.note}
        colour={event.colour}
        handleSubmit={handleSubmit}
      />
      <div className={style.column}>
        <Editor.Title>
          Custom Fields
          {isEditor && <AppLink search='settings=feature_settings__custom'>Manage</AppLink>}
        </Editor.Title>

        {Object.keys(customFields).map((fieldKey) => {
          const key = `${event.id}-${fieldKey}`;
          const fieldName = `custom-${fieldKey}`;
          const initialValue = event.custom[fieldKey] ?? '';
          const { backgroundColor, color } = getAccessibleColour(customFields[fieldKey].colour);
          const labelText = customFields[fieldKey].label;

          if (customFields[fieldKey].type === 'string') {
            return (
              <EventTextArea
                key={key}
                field={fieldName}
                label={labelText}
                initialValue={initialValue}
                submitHandler={handleSubmit}
                className={style.decorated}
                style={{ '--decorator-bg': backgroundColor, '--decorator-color': color } as CSSProperties}
              />
            );
          }

          if (customFields[fieldKey].type === 'image') {
            return (
              <div key={key} className={style.customImage}>
                <EventTextInput
                  key={key}
                  field={fieldName}
                  label={labelText}
                  initialValue={initialValue}
                  placeholder='Paste image URL'
                  submitHandler={handleSubmit}
                  className={style.decorated}
                  maxLength={255}
                  style={{ '--decorator-bg': backgroundColor, '--decorator-color': color } as CSSProperties}
                />
                <EventEditorImage src={initialValue} />
              </div>
            );
          }

          // we should have exhausted all types by now
          return null;
        })}
      </div>
      <div className={style.column}>
        <Editor.Title>
          Triggers
          {isEditor && <AppLink search='settings=automation__automations'>Manage</AppLink>}
        </Editor.Title>
        {event.triggers !== undefined && <EventTriggers triggers={event.triggers} deleteHandler={deleteTrigger} />}
        <div className={style.inline}>
          <Select
            size='sm'
            variant='ontime'
            value={newTriggerValue.id}
            onChange={(e) => setNewTriggerValue({ id: e.target.value, cycle: newTriggerValue.cycle })}
          >
            {Object.values(automationSettings.automations).map(({ id, title }) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </Select>
          <Select
            size='sm'
            variant='ontime'
            value={newTriggerValue.cycle}
            onChange={(e) => setNewTriggerValue({ id: newTriggerValue.id, cycle: e.target.value })}
            defaultValue={TimerLifeCycle.onStart}
          >
            {['onLoad', 'onStart', 'onPause', 'onFinish', 'onWarning', 'onDanger'].map((cycle) => (
              <option key={cycle} value={cycle}>
                {cycle}
              </option>
            ))}
          </Select>
          <IconButton
            onClick={() => submitTrigger(newTriggerValue)}
            size='sm'
            variant='ontime-ghosted'
            aria-label='Add entry'
            icon={<IoAddCircle />}
          />
        </div>
      </div>
    </div>
  );
}
