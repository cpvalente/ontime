import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CustomFieldLabel,
  EndAction,
  isOntimeEvent,
  OntimeEvent,
  SupportedEvent,
  TimerType,
  TimeStrategy,
} from 'ontime-types';

import { useEventAction } from '../../../common/hooks/useEventAction';
import useRundown from '../../../common/hooks-query/useRundown';
import { useEventSelection } from '../useEventSelection';

import style from './EventEditor.module.scss';
import EventEditor from './EventEditor';

export type EventEditorSubmitActions = keyof OntimeEvent;

export type EditorUpdateFields = 'cue' | 'title' | 'note' | 'colour' | CustomFieldLabel;

export default function EventEditorWrapper() {
  const selectedEvents = useEventSelection((state) => state.selectedEvents);
  const { data } = useRundown();
  const { order, rundown } = data;
  const { updateEvent } = useEventAction();
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

  const handleSingleSubmit = useCallback(
    (field: EditorUpdateFields, value: string) => {
      if (field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        updateEvent({ id: event?.id, custom: { [fieldLabel]: { value } } });
      } else {
        updateEvent({ id: event?.id, [field]: value });
      }
    },
    [event?.id, updateEvent],
  );

  const handleMultipleSubmits = useCallback(
    (field: EditorUpdateFields, value: string) => {
      if (field.startsWith('custom-')) {
        // const fieldLabel = field.split('custom-')[1];
        // updateEvent({ id: event?.id, custom: { [fieldLabel]: { value } } });
      } else {
        // updateEvent({ id: event?.id, [field]: value });
      }
    },
    [event?.id, updateEvent],
  );

  if (!event) {
    return (
      <div className={style.eventEditor} data-testid='editor-container'>
        Select an event to edit
      </div>
    );
  }

  const getMultipleEvent = (): OntimeEvent => {
    const allHaveSameValue = (arr: any[], propertyName: string) => {
      if (!arr || arr.length <= 0) return false;
      return arr.every((obj) => JSON.stringify(obj[propertyName]) === JSON.stringify(arr[0][propertyName]));
    };

    const events: OntimeEvent[] = [];
    let eventsIds: string = '';

    for (const event of selectedEvents) {
      const data = rundown[event];
      if (data && isOntimeEvent(data)) {
        events.push(data);
        eventsIds += `${event} `;
      }
    }

    const multipleEvents: Partial<OntimeEvent> = {
      id: eventsIds.trim().split(' ').join(', '),
      colour: allHaveSameValue(events, 'colour') ? events[0]['colour'] : 'unkown',
      custom: allHaveSameValue(events, 'custom') ? events[0]['custom'] : undefined,
      duration: allHaveSameValue(events, 'duration') ? events[0]['duration'] : undefined,
      endAction: allHaveSameValue(events, 'endAction') ? events[0]['endAction'] : EndAction.Unkown,
      delay: allHaveSameValue(events, 'delay') ? events[0]['delay'] : undefined,
      isPublic: allHaveSameValue(events, 'isPublic') ? events[0]['isPublic'] : true, // ??
      linkStart: allHaveSameValue(events, 'linkStart') ? events[0]['linkStart'] : null,
      note: allHaveSameValue(events, 'note') ? events[0]['note'] : '', // ??
      revision: allHaveSameValue(events, 'revision') ? events[0]['revision'] : undefined,
      skip: allHaveSameValue(events, 'skip') ? events[0]['skip'] : undefined,
      timeDanger: allHaveSameValue(events, 'timeDanger') ? events[0]['timeDanger'] : undefined,
      timeEnd: allHaveSameValue(events, 'timeEnd') ? events[0]['timeEnd'] : undefined,
      timeStart: allHaveSameValue(events, 'timeStart') ? events[0]['timeStart'] : undefined,
      timeStrategy: allHaveSameValue(events, 'timeStrategy') ? events[0]['timeStrategy'] : TimeStrategy.Unkown,
      timeWarning: allHaveSameValue(events, 'timeWarning') ? events[0]['timeWarning'] : undefined,
      timerType: allHaveSameValue(events, 'timerType') ? events[0]['timerType'] : TimerType.Unkown,
      title: allHaveSameValue(events, 'title') ? events[0]['title'] : '', // ??
      type: allHaveSameValue(events, 'type') ? events[0]['type'] : SupportedEvent.Event,
      cue: allHaveSameValue(events, 'cue') ? events[0]['cue'] : 'unkown',
    };

    return {
      ...event,
      ...multipleEvents,
    };
  };

  return (
    <div className={style.eventEditor} data-testid='editor-container'>
      {selectedEvents.size <= 1 ? (
        <EventEditor event={event} handleSubmit={handleSingleSubmit} isMultiple={false} />
      ) : (
        <EventEditor event={getMultipleEvent()} handleSubmit={handleMultipleSubmits} isMultiple={true} />
      )}
    </div>
  );
}
