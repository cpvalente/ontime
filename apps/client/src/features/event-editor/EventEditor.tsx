import { useCallback, useEffect, useState } from 'react';
import { isOntimeEvent, OntimeEvent } from 'ontime-types';

import CopyTag from '../../common/components/copy-tag/CopyTag';
import { useEventAction } from '../../common/hooks/useEventAction';
import useRundown from '../../common/hooks-query/useRundown';
import { useAppMode } from '../../common/stores/appModeStore';

import EventEditorDataLeft from './composite/EventEditorDataLeft';
import EventEditorDataRight from './composite/EventEditorDataRight';
import EventEditorTimes from './composite/EventEditorTimes';

import style from './EventEditor.module.scss';

export type EventEditorSubmitActions = keyof OntimeEvent;
export type EditorUpdateFields = 'cue' | 'title' | 'presenter' | 'subtitle' | 'note' | 'colour';

export default function EventEditor() {
  const openId = useAppMode((state) => state.editId);
  const { data } = useRundown();
  const { updateEvent } = useEventAction();

  const [event, setEvent] = useState<OntimeEvent | null>(null);

  useEffect(() => {
    if (!data || !openId) {
      setEvent(null);
      return;
    }

    const event = data.find((event) => event.id === openId);
    if (event && isOntimeEvent(event)) {
      setEvent(event);
    }
  }, [data, openId]);

  const handleSubmit = useCallback(
    (field: EditorUpdateFields, value: string) => {
      updateEvent({ id: event?.id, [field]: value });
    },
    [event?.id, updateEvent],
  );

  if (!event) {
    return <span>Loading...</span>;
  }

  return (
    <div className={style.eventEditor}>
      <EventEditorTimes
        eventId={event.id}
        timeStart={event.timeStart}
        timeEnd={event.timeEnd}
        duration={event.duration}
        delay={event.delay ?? 0}
        isPublic={event.isPublic}
        endAction={event.endAction}
        timerType={event.timerType}
      />
      <EventEditorDataLeft
        key={`${event.id}-left`}
        eventId={event.id}
        cue={event.cue}
        title={event.title}
        presenter={event.presenter}
        subtitle={event.subtitle}
        handleSubmit={handleSubmit}
      />
      <EventEditorDataRight
        key={`${event.id}-right`}
        note={event.note}
        colour={event.colour}
        handleSubmit={handleSubmit}
      >
        <CopyTag label='Event ID'>{event.id}</CopyTag>
        <CopyTag label='OSC trigger by id'>{`/ontime/gotoid "${event.id}"`}</CopyTag>
        <CopyTag label='OSC trigger by cue'>{`/ontime/gotocue "${event.cue}"`}</CopyTag>
      </EventEditorDataRight>
    </div>
  );
}
