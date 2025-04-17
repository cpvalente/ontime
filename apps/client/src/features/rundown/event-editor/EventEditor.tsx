import { useCallback } from 'react';
import { CustomFieldLabel, OntimeEvent } from 'ontime-types';

import AppLink from '../../../common/components/link/app-link/AppLink';
import { useEventAction } from '../../../common/hooks/useEventAction';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import * as Editor from '../../editors/editor-utils/EditorUtils';

import EventCustom from './composite/EventEditorCustom';
import EventEditorTimes from './composite/EventEditorTimes';
import EventEditorTitles from './composite/EventEditorTitles';
import EventEditorTriggers from './composite/EventEditorTriggers';
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
        updateEvent({ id: event?.id, custom: { [fieldLabel]: value } });
      } else {
        updateEvent({ id: event?.id, [field]: value });
      }
    },
    [event?.id, updateEvent],
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
        <EventCustom fields={customFields} handleSubmit={handleSubmit} event={event} />
      </div>
      <div className={style.column}>
        <Editor.Title>
          Triggers
          {isEditor && <AppLink search='settings=automation__automations'>Manage</AppLink>}
        </Editor.Title>
        <EventEditorTriggers triggers={event.triggers} eventId={event.id} />
      </div>
    </div>
  );
}
