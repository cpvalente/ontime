import { useEffect, useState } from 'react';
import {
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  isOntimeMilestone,
  OntimeBlock,
  OntimeEvent,
  OntimeMilestone,
} from 'ontime-types';

import useRundown from '../../../common/hooks-query/useRundown';
import { useEventSelection } from '../useEventSelection';

import EventEditorFooter from './composite/EventEditorFooter';
import BlockEditor from './BlockEditor';
import EventEditor from './EventEditor';
import EventEditorEmpty from './EventEditorEmpty';
import MilestoneEditor from './MilestoneEditor';

import style from './EntryEditor.module.scss';

export default function RundownEntryEditor() {
  const selectedEvents = useEventSelection((state) => state.selectedEvents);
  const { data } = useRundown();

  const [entry, setEntry] = useState<OntimeEvent | OntimeBlock | OntimeMilestone | null>(null);

  useEffect(() => {
    if (data.order.length === 0) {
      setEntry(null);
      return;
    }

    const selectedEventId = Array.from(selectedEvents).at(0);
    if (!selectedEventId) {
      setEntry(null);
      return;
    }
    const event = data.entries[selectedEventId];

    if (event && !isOntimeDelay(event)) {
      setEntry(event);
    } else {
      setEntry(null);
    }
  }, [data.order, data.entries, selectedEvents]);

  if (!entry) {
    return <EventEditorEmpty />;
  }

  if (isOntimeEvent(entry)) {
    return (
      <div className={style.entryEditor} data-testid='editor-container'>
        <EventEditor event={entry} />
        <EventEditorFooter id={entry.id} cue={entry.cue} />
      </div>
    );
  }

  if (isOntimeMilestone(entry)) {
    return (
      <div className={style.entryEditor} data-testid='editor-container'>
        <MilestoneEditor milestone={entry} />
      </div>
    );
  }

  if (isOntimeBlock(entry)) {
    return (
      <div className={style.entryEditor} data-testid='editor-container'>
        <BlockEditor block={entry} />
      </div>
    );
  }

  return null;
}
