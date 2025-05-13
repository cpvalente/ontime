import { memo, useEffect, useState } from 'react';
import { isOntimeEvent, OntimeEvent } from 'ontime-types';

import useRundown from '../../../common/hooks-query/useRundown';
import { useEventSelection } from '../useEventSelection';

import { EventEditorFooter } from './composite/EventEditorFooter';
import EventEditorEmpty from './EventEditorEmpty';
import MobileEventEditor from './MobileEventEditor';

import style from './EventEditor.module.scss';

function MobileRundownEventEditor() {
  const selectedEvents = useEventSelection((state) => state.selectedEvents);
  const { data } = useRundown();
  const { order, rundown } = data;

  const [event, setEvent] = useState<OntimeEvent | null>(null);

  useEffect(() => {
    if (order.length === 0) {
      setEvent(null);
      return;
    }

    const selectedEventId = order.find((eventId) => selectedEvents.has(eventId));
    if (!selectedEventId) {
      setEvent(null);
      return;
    }
    const event = rundown[selectedEventId];

    if (event && isOntimeEvent(event)) {
      setEvent(event);
    } else {
      setEvent(null);
    }
  }, [order, rundown, selectedEvents]);

  if (!event) {
    return <EventEditorEmpty />;
  }

  return (
    <div className={style.eventEditor} data-testid='editor-container'>
      <MobileEventEditor event={event} />
      <EventEditorFooter id={event.id} cue={event.cue} />
    </div>
  );
}

export default memo(MobileRundownEventEditor);
