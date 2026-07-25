import { OntimeEntry, OntimeEvent, isOntimeEvent, isOntimeGroup, isOntimeMilestone } from 'ontime-types';
import { useMemo } from 'react';

import useRundown from '../../../common/hooks-query/useRundown';
import { useEventSelection } from '../useEventSelection';
import EventEditorFooter from './composite/EventEditorFooter';
import EventEditor from './EventEditor';
import EventEditorEmpty from './EventEditorEmpty';
import GroupEditor from './GroupEditor';
import MilestoneEditor from './MilestoneEditor';

import style from './EntryEditor.module.scss';

export default function RundownEntryEditor() {
  const selectedEvents = useEventSelection((state) => state.selectedEvents);
  const { data } = useRundown();

  /**
   * Events in the current selection
   * Only events can be multi selected, groups and milestones are always selected on their own
   */
  const events = useMemo<OntimeEvent[]>(() => {
    if (data.order.length === 0) {
      return [];
    }

    const selection: OntimeEvent[] = [];
    selectedEvents.forEach((entryId) => {
      const entry = data.entries[entryId];
      if (isOntimeEvent(entry)) {
        selection.push(entry);
      }
    });
    return selection;
  }, [data.order.length, data.entries, selectedEvents]);

  const entry = useMemo<OntimeEntry | null>(() => {
    if (data.order.length === 0) {
      return null;
    }

    const selectedEventId = Array.from(selectedEvents).at(0);
    if (!selectedEventId) {
      return null;
    }

    const event = data.entries[selectedEventId];
    return event ?? null;
  }, [data.order.length, data.entries, selectedEvents]);

  if (events.length > 0) {
    const singleEvent = events.length === 1 ? events[0] : null;
    return (
      <div className={style.rundownEditor} data-testid='editor-container'>
        <EventEditor events={events} />
        {singleEvent && <EventEditorFooter id={singleEvent.id} cue={singleEvent.cue} />}
      </div>
    );
  }

  if (!entry) {
    return <EventEditorEmpty />;
  }

  if (isOntimeMilestone(entry)) {
    return (
      <div className={style.rundownEditor} data-testid='editor-container'>
        <MilestoneEditor milestone={entry} />
      </div>
    );
  }

  if (isOntimeGroup(entry)) {
    return (
      <div className={style.rundownEditor} data-testid='editor-container'>
        <GroupEditor group={entry} />
      </div>
    );
  }

  return null;
}
