import { useCallback } from 'react';
import { OntimeEvent } from 'ontime-types';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import AppLink from '../../../common/components/link/app-link/AppLink';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import useCustomFields from '../../../common/hooks-query/useCustomFields';

import EventCustom from './composite/EventEditorCustom';
import EventEditorTimes from './composite/EventEditorTimes';
import EventEditorTitles from './composite/EventEditorTitles';
import EventEditorTriggers from './composite/EventEditorTriggers';
import EventEditorEmpty from './EventEditorEmpty';

import style from './EventEditor.module.scss';

// any of the titles + custom field labels
export type EditorUpdateFields = 'cue' | 'title' | 'note' | 'colour' | string;

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
          {isEditor && <AppLink search='settings=feature_settings__custom'>Manage Custom Fields</AppLink>}
        </Editor.Title>
        <EventCustom fields={customFields} handleSubmit={handleSubmit} event={event} />
      </div>
      <div className={style.column}>
        <Editor.Title>
          Automations
          {isEditor && <AppLink search='settings=automation__automations'>Manage Automations</AppLink>}
        </Editor.Title>
        <EventEditorTriggers triggers={event.triggers} eventId={event.id} />
      </div>
    </div>
  );
}
