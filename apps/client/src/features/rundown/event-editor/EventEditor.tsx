import { CSSProperties, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomFieldLabel, OntimeEvent } from 'ontime-types';

import { Button } from '../../../common/components/ui/button';
import { useEventAction } from '../../../common/hooks/useEventAction';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import { getAccessibleColour } from '../../../common/utils/styleUtils';
import * as Editor from '../../editors/editor-utils/EditorUtils';

import EventEditorTimes from './composite/EventEditorTimes';
import EventEditorTitles from './composite/EventEditorTitles';
import EventTextArea from './composite/EventTextArea';
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
  const [_searchParams, setSearchParams] = useSearchParams();

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

  const handleOpenCustomManager = () => {
    setSearchParams({ settings: 'feature_settings__custom' });
  };

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
          {isEditor && (
            <Button variant='ontime-subtle' size='sm' onClick={handleOpenCustomManager}>
              Manage
            </Button>
          )}
        </Editor.Title>
        {Object.keys(customFields).map((fieldKey) => {
          const key = `${event.id}-${fieldKey}`;
          const fieldName = `custom-${fieldKey}`;
          const initialValue = event.custom[fieldKey] ?? '';
          const { backgroundColor, color } = getAccessibleColour(customFields[fieldKey].colour);
          const labelText = customFields[fieldKey].label;

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
        })}
      </div>
    </div>
  );
}
