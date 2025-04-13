import { CSSProperties, useCallback } from 'react';
import { CustomFieldLabel, isTimerLifeCycle, OntimeEvent, Trigger } from 'ontime-types';
import { generateId } from 'ontime-utils';

import AppLink from '../../../common/components/link/app-link/AppLink';
import { useEventAction } from '../../../common/hooks/useEventAction';
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

  const isEditor = window.location.pathname.includes('editor');

  const handleSubmit = useCallback(
    (field: EditorUpdateFields, value: string) => {
      if (field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        updateEvent({ id: event.id, custom: { [fieldLabel]: value } });
      } else if (field.startsWith('trigger-')) {
        const triggerId = field.split('trigger-')[1];
        if (isTimerLifeCycle(value)) {
          const triggers = event.triggers ?? new Array<Trigger>();
          const id = generateId();
          triggers.push({ id, title: '', trigger: value, automationId: triggerId });
          updateEvent({ id: event?.id, triggers });
        } else if (event.triggers) {
          const triggers = event.triggers.filter((trigger) => trigger.id !== triggerId);
          updateEvent({ id: event.id, triggers: triggers });
        }
      } else {
        updateEvent({ id: event.id, [field]: value });
      }
    },
    [event.id, event.triggers, updateEvent],
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
        <EventTriggers triggers={event.triggers} handleSubmit={handleSubmit} />
      </div>
    </div>
  );
}
