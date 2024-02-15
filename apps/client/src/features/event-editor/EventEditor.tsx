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
export type EditorUpdateFields =
  | 'cue'
  | 'title'
  | 'presenter'
  | 'subtitle'
  | 'note'
  | 'colour'
  | 'user0'
  | 'user1'
  | 'user2'
  | 'user3'
  | 'user4'
  | 'user5'
  | 'user6'
  | 'user7'
  | 'user8'
  | 'user9';

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
        colour={event.colour}
        note={event.note}
        user0={event.user0}
        user1={event.user1}
        user2={event.user2}
        user3={event.user3}
        user4={event.user4}
        user5={event.user5}
        user6={event.user6}
        user7={event.user7}
        user8={event.user8}
        user9={event.user9}
        handleSubmit={handleSubmit}
      >
        <CopyTag label='Event ID'>{event.id}</CopyTag>
        <CopyTag label='OSC trigger by id'>{`/ontime/gotoid "${event.id}"`}</CopyTag>
        <CopyTag label='OSC trigger by cue'>{`/ontime/gotocue "${event.cue}"`}</CopyTag>
      </EventEditorDataRight>
    </div>
  );
}
