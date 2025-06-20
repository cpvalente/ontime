import { useEffect, useState } from 'react';
import { isOntimeEvent, OntimeEvent } from 'ontime-types';

import useRundown from '../../../common/hooks-query/useRundown';
import { useEventSelection } from '../useEventSelection';

import { EventEditorFooter } from './composite/EventEditorFooter';
import EventEditor from './EventEditor';
import EventEditorEmpty from './EventEditorEmpty';

import style from './EventEditor.module.scss';

export default function RundownEventEditor() {
  const selectedEvents = useEventSelection((state) => state.selectedEvents);
  const { data } = useRundown();

  const [event, setEvent] = useState<OntimeEvent | null>(null);

  useEffect(() => {
    if (data.order.length === 0) {
      setEvent(null);
      return;
    }

    const selectedEventId = data.order.find((entryId) => selectedEvents.has(entryId));
    if (!selectedEventId) {
      setEvent(null);
      return;
    }
    const event = data.entries[selectedEventId];

    if (event && isOntimeEvent(event)) {
      setEvent(event);
    } else {
      setEvent(null);
    }
  }, [data.order, data.entries, selectedEvents]);

  if (!event) {
    return <EventEditorEmpty />;
  }

  return (
    <div className={style.eventEditor} data-testid='editor-container'>
      <EventEditor event={event} />
      <EventEditorFooter id={event.id} cue={event.cue} />
    </div>
  );
}
