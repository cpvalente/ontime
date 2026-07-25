import { OntimeEvent } from 'ontime-types';
import { useCallback, useMemo } from 'react';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import Info from '../../../common/components/info/Info';
import AppLink from '../../../common/components/link/app-link/AppLink';
import { useEntryActionsContext } from '../../../common/context/EntryActionsContext';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import EventEditorBatchSchedule from './composite/EventEditorBatchSchedule';
import EntryEditorCustomFields from './composite/EventEditorCustomFields';
import EventEditorSchedule from './composite/EventEditorSchedule';
import EventEditorTimes from './composite/EventEditorTimes';
import EventEditorTitles from './composite/EventEditorTitles';
import EventEditorTriggers from './composite/EventEditorTriggers';
import { mixedPlaceholder } from './entryEditor.utils';
import { mergeEvents, resolveConflict } from './mergeEvents';

import style from './EntryEditor.module.scss';

// any of the titles + colour + custom field labels
export type EventEditorUpdateFields = 'cue' | 'title' | 'note' | 'colour' | string;

interface EventEditorProps {
  /** events being edited, editing several events at once shows a merged view of their values */
  events: OntimeEvent[];
}

export default function EventEditor({ events }: EventEditorProps) {
  const { data: customFields } = useCustomFields();
  const { updateEntry, batchUpdateEvents } = useEntryActionsContext();

  const isEditor = window.location.pathname.includes('editor');

  const ids = useMemo(() => events.map((event) => event.id), [events]);
  const merged = useMemo(() => mergeEvents(events), [events]);

  // when editing a single event, we can show the values which are unique to it
  const singleEvent = events.length === 1 ? events[0] : null;

  /**
   * Applies a patch to every event being edited
   */
  const submit = useCallback(
    (patch: Partial<OntimeEvent>) => {
      if (ids.length === 1) {
        updateEntry({ id: ids[0], ...patch });
        return;
      }
      batchUpdateEvents(patch, ids);
    },
    [batchUpdateEvents, ids, updateEntry],
  );

  const handleSubmit = useCallback(
    (field: EventEditorUpdateFields, value: string) => {
      if (field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        submit({ custom: { [fieldLabel]: value } });
      } else {
        submit({ [field]: value });
      }
    },
    [submit],
  );

  // inputs keep local state, we remount them when the edited entries change
  const editorKey = ids.join();

  return (
    <div className={style.content}>
      {singleEvent ? (
        <EventEditorSchedule
          key={`${editorKey}-schedule`}
          eventId={singleEvent.id}
          timeStart={singleEvent.timeStart}
          timeEnd={singleEvent.timeEnd}
          duration={singleEvent.duration}
          timeStrategy={singleEvent.timeStrategy}
          linkStart={singleEvent.linkStart}
          delay={singleEvent.delay}
        />
      ) : (
        <EventEditorBatchSchedule
          key={`${editorKey}-schedule`}
          duration={resolveConflict(merged.duration)}
          submit={submit}
        />
      )}
      <EventEditorTimes
        key={`${editorKey}-times`}
        countToEnd={resolveConflict(merged.countToEnd)}
        endAction={resolveConflict(merged.endAction)}
        timerType={resolveConflict(merged.timerType)}
        timeWarning={resolveConflict(merged.timeWarning)}
        timeDanger={resolveConflict(merged.timeDanger)}
        submit={submit}
      />
      <EventEditorTitles
        key={`${editorKey}-titles`}
        eventId={singleEvent?.id ?? null}
        eventCount={events.length}
        cue={singleEvent?.cue ?? ''}
        flag={resolveConflict(merged.flag)}
        title={resolveConflict(merged.title)}
        note={resolveConflict(merged.note)}
        colour={resolveConflict(merged.colour)}
        submit={submit}
      />
      <div className={style.column}>
        <Editor.Title>
          Custom Fields
          {isEditor && <AppLink search='settings=manage__custom'>Manage Custom Fields</AppLink>}
        </Editor.Title>
        <EntryEditorCustomFields
          key={`${editorKey}-custom`}
          fields={customFields}
          custom={merged.custom}
          idKey={editorKey}
          mixedPlaceholder={mixedPlaceholder}
          handleSubmit={handleSubmit}
        />
      </div>
      <div className={style.column}>
        <Editor.Title>
          Automations
          {isEditor && singleEvent && <AppLink search='settings=automation'>Manage Automations</AppLink>}
        </Editor.Title>
        {singleEvent ? (
          <EventEditorTriggers triggers={singleEvent.triggers} eventId={singleEvent.id} />
        ) : (
          <Info>Automations are not available when editing multiple events</Info>
        )}
      </div>
    </div>
  );
}
