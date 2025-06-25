import { useEffect, useState } from 'react';
import { isOntimeBlock, isOntimeDelay, OntimeBlock, OntimeEvent } from 'ontime-types';

import useRundown from '../../../common/hooks-query/useRundown';
import { useEventSelection } from '../useEventSelection';

import EventEditorFooter from './composite/EventEditorFooter';
import BlockEditor from './BlockEditor';
import EventEditor from './EventEditor';
import EventEditorEmpty from './EventEditorEmpty';

import style from './EntryEditor.module.scss';

export default function RundownEntryEditor() {
  const selectedEvents = useEventSelection((state) => state.selectedEvents);
  const { data } = useRundown();

  const [event, setEvent] = useState<OntimeEvent | OntimeBlock | null>(null);

  useEffect(() => {
    if (data.order.length === 0) {
      setEvent(null);
      return;
    }

    const selectedEventId = Array.from(selectedEvents).at(0);
    if (!selectedEventId) {
      setEvent(null);
      return;
    }
    const event = data.entries[selectedEventId];

    if (event && !isOntimeDelay(event)) {
      setEvent(event);
    } else {
      setEvent(null);
    }
  }, [data.order, data.entries, selectedEvents]);

  if (!event) {
    return <EventEditorEmpty />;
  }

  if (isOntimeBlock(event)) {
    return (
      <div className={style.entryEditor} data-testid='editor-container'>
        <BlockEditor block={event} />
      </div>
    );
  }

  return (
    <div className={style.entryEditor} data-testid='editor-container'>
      <EventEditor event={event} />
      <EventEditorFooter id={event.id} cue={event.cue} />
    </div>
  );
}
