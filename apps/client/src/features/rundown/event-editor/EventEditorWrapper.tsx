import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isOntimeEvent, OntimeEvent, SupportedEvent } from 'ontime-types';

import useCustomFields from '../../../common/hooks-query/useCustomFields';
import useRundown from '../../../common/hooks-query/useRundown';
import { useEventSelection } from '../useEventSelection';

import EventEditor, { type MultiOntimeEvent } from './EventEditor';
import EventEditorEmpty from './EventEditorEmpty';

import style from './EventEditor.module.scss';

export default function EventEditorWrapper() {
  const selectedEvents = useEventSelection((state) => state.selectedEvents);
  const { data: customFields } = useCustomFields();
  const { data } = useRundown();
  const { order, rundown } = data;
  const [_searchParams] = useSearchParams();

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

  const getMultipleEvent = (): MultiOntimeEvent => {
    const allHaveSameValue = (arr: OntimeEvent[], propertyName: keyof OntimeEvent) => {
      if (!arr || arr.length <= 0) {
        return false;
      }
      return arr.every((event) => event[propertyName] === arr[0][propertyName]);
    };

    const allHaveSameCustomValue = (arr: OntimeEvent[]) => {
      if (!arr || arr.length <= 0) {
        return false;
      }

      const collectedFields = Object.keys(customFields).reduce((acc, field) => {
        if (arr.every((event) => event.custom[field] === arr[0].custom[field])) {
          Object.assign(acc, { [field]: arr[0].custom[field] ?? '' });
        } else {
          Object.assign(acc, { [field]: undefined });
        }
        return acc;
      }, {});
      return collectedFields;
    };

    const events: OntimeEvent[] = [];
    const eventsIds: string[] = [];

    for (const entryId of selectedEvents) {
      const data = rundown[entryId];
      if (data && isOntimeEvent(data)) {
        events.push(data);
        eventsIds.push(entryId);
      }
    }

    const multipleEvents: MultiOntimeEvent = {
      ids: eventsIds,
      colour: allHaveSameValue(events, 'colour') ? events[0]['colour'] : undefined,
      custom: allHaveSameCustomValue(events),
      duration: allHaveSameValue(events, 'duration') ? events[0]['duration'] : undefined,
      endAction: allHaveSameValue(events, 'endAction') ? events[0]['endAction'] : undefined,
      isPublic: allHaveSameValue(events, 'isPublic') ? events[0]['isPublic'] : undefined,
      linkStart: allHaveSameValue(events, 'linkStart') ? events[0]['linkStart'] : undefined,
      note: allHaveSameValue(events, 'note') ? events[0]['note'] : undefined,
      revision: allHaveSameValue(events, 'revision') ? events[0]['revision'] : undefined,
      skip: allHaveSameValue(events, 'skip') ? events[0]['skip'] : undefined,
      timeDanger: allHaveSameValue(events, 'timeDanger') ? events[0]['timeDanger'] : undefined,
      timeEnd: allHaveSameValue(events, 'timeEnd') ? events[0]['timeEnd'] : undefined,
      timeStart: allHaveSameValue(events, 'timeStart') ? events[0]['timeStart'] : undefined,
      timeStrategy: allHaveSameValue(events, 'timeStrategy') ? events[0]['timeStrategy'] : undefined,
      timeWarning: allHaveSameValue(events, 'timeWarning') ? events[0]['timeWarning'] : undefined,
      timerType: allHaveSameValue(events, 'timerType') ? events[0]['timerType'] : undefined,
      title: allHaveSameValue(events, 'title') ? events[0]['title'] : undefined,
      type: SupportedEvent.Event, //They are all ontime events
      cue: allHaveSameValue(events, 'cue') ? events[0]['cue'] : undefined,
    };

    return multipleEvents;
  };

  return (
    <div className={style.eventEditor} data-testid='editor-container'>
      {selectedEvents.size <= 1 ? <EventEditor event={event} /> : <EventEditor event={getMultipleEvent()} isMultiple />}
    </div>
  );
}
