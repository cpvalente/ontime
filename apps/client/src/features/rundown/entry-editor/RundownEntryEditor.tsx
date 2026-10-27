import { OntimeEntry, isOntimeDelay, isOntimeEvent, isOntimeGroup, isOntimeMilestone } from 'ontime-types';
import { useMemo } from 'react';

import useRundown from '../../../common/hooks-query/useRundown';
import { useEventSelection } from '../useEventSelection';
import EventEditorFooter from './composite/EventEditorFooter';
import { getEditTarget } from './entryEditor.utils';
import EventEditor from './EventEditor';
import EventEditorEmpty from './EventEditorEmpty';
import GroupEditor from './GroupEditor';
import MilestoneEditor from './MilestoneEditor';

import style from './EntryEditor.module.scss';

export default function RundownEntryEditor() {
  const selectedEvents = useEventSelection((state) => state.selectedEvents);
  const cursor = useEventSelection((state) => state.cursor);
  const { data } = useRundown();

  const entry = useMemo<OntimeEntry | null>(() => {
    if (data.order.length === 0) {
      return null;
    }

    return getEditTarget(selectedEvents, cursor, data.entries);
  }, [data.order.length, data.entries, selectedEvents, cursor]);

  if (!entry) {
    return <EventEditorEmpty />;
  }

  if (isOntimeEvent(entry)) {
    return (
      <div className={style.rundownEditor} data-testid='editor-container'>
        <EventEditor event={entry} />
        <EventEditorFooter id={entry.id} cue={entry.cue} />
      </div>
    );
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

  if (isOntimeDelay(entry)) {
    return (
      <div className={style.rundownEditor} data-testid='editor-container'>
        <div className={style.hint}>
          <span className={style.hintTitle}>Delays are edited in the rundown</span>
          <span>Set the delay time in the rundown, then make it permanent or cancel it.</span>
        </div>
      </div>
    );
  }

  return null;
}
