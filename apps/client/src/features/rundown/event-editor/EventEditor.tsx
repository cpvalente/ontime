import { CSSProperties, useCallback } from 'react';
import { CustomFieldLabel, OntimeEvent } from 'ontime-types';

import AppLink from '../../../common/components/link/app-link/AppLink';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import { getAccessibleColour } from '../../../common/utils/styleUtils';
import * as Editor from '../../editors/editor-utils/EditorUtils';

import EventEditorImage from './composite/EventEditorImage';
import EventEditorTimes from './composite/EventEditorTimes';
import EventEditorTitles from './composite/EventEditorTitles';
import EventTextArea from './composite/EventTextArea';
import EventTextInput from './composite/EventTextInput';
import EventEditorEmpty from './EventEditorEmpty';

import style from './EventEditor.module.scss';

export type EditorUpdateFields = 'cue' | 'title' | 'note' | 'colour' | CustomFieldLabel;

interface EventEditorProps {
  event: OntimeEvent;
}

export default function EventEditor(props: EventEditorProps) {
  const { event } = props;
  const { data: customFields } = useCustomFields();
  const { updateEntry } = useEntryActions();

  const isEditor = window.location.pathname.includes('editor');

  const handleSubmit = useCallback(
    (field: EditorUpdateFields, value: string) => {
      if (field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        updateEntry({ id: event?.id, custom: { [fieldLabel]: value } });
      } else {
        updateEntry({ id: event?.id, [field]: value });
      }
    },
    [event?.id, updateEntry],
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
    </div>
  );
}
