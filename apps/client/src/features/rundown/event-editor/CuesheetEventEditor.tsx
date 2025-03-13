import { useEffect, useState } from 'react';
import { isOntimeEvent, OntimeEvent } from 'ontime-types';

import useRundown from '../../../common/hooks-query/useRundown';
import { cx } from '../../../common/utils/styleUtils';

import EventEditor from './EventEditor';

import style from './EventEditor.module.scss';

interface CuesheetEventEditorProps {
  eventId: string;
}

export default function CuesheetEventEditor(props: CuesheetEventEditorProps) {
  const { eventId } = props;
  const { data } = useRundown();
  const { order, rundown } = data;

  const [event, setEvent] = useState<OntimeEvent | null>(null);

  useEffect(() => {
    if (order.length === 0) {
      setEvent(null);
      return;
    }

    const event = rundown[eventId];
    if (event && isOntimeEvent(event)) {
      setEvent(event);
    } else {
      setEvent(null);
    }
  }, [data, eventId, order, rundown]);

  if (!event) {
    return null;
  }

  return (
    <div className={cx([style.eventEditor, style.inModal])} data-testid='editor-container'>
      <EventEditor event={event} />
    </div>
  );
}
