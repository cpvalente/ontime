import { useCallback } from 'react';
import { OntimeEvent } from 'ontime-types';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import AppLink from '../../../common/components/link/app-link/AppLink';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import useCustomFields from '../../../common/hooks-query/useCustomFields';

import EntryEditorCustomFields from './composite/EventEditorCustomFields';
import EventEditorTimes from './composite/EventEditorTimes';
import EventEditorTitles from './composite/EventEditorTitles';
import EventEditorTriggers from './composite/EventEditorTriggers';

import style from './EntryEditor.module.scss';

// any of the titles + colour + custom field labels
export type EventEditorUpdateFields = 'cue' | 'title' | 'note' | 'colour' | string;

interface EventEditorProps {
  event: OntimeEvent;
}

export default function EventEditor({ event }: EventEditorProps) {
  const { data: customFields } = useCustomFields();
  const { updateEntry } = useEntryActions();

  const isEditor = window.location.pathname.includes('editor');

  const handleSubmit = useCallback(
    (field: EventEditorUpdateFields, value: string) => {
      if (field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        updateEntry({ id: event.id, custom: { [fieldLabel]: value } });
      } else {
        updateEntry({ id: event.id, [field]: value });
      }
    },
    [event.id, updateEntry],
  );

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
        delay={event.delay}
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
          {isEditor && <AppLink search='settings=manage__custom'>Manage Custom Fields</AppLink>}
        </Editor.Title>
        <EntryEditorCustomFields fields={customFields} handleSubmit={handleSubmit} entry={event} />
      </div>
      <div className={style.column}>
        <Editor.Title>
          Automations
          {isEditor && <AppLink search='settings=automation'>Manage Automations</AppLink>}
        </Editor.Title>
        <EventEditorTriggers triggers={event.triggers} eventId={event.id} />
      </div>
    </div>
  );
}
