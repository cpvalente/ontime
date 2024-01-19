import { useCallback, useEffect, useState } from 'react';
import { isOntimeEvent, OntimeEvent } from 'ontime-types';

import CopyTag from '../../../common/components/copy-tag/CopyTag';
import { useEventAction } from '../../../common/hooks/useEventAction';
import useRundown from '../../../common/hooks-query/useRundown';
import EventEditorDataLeft from '../../event-editor/composite/EventEditorDataLeft';
import EventEditorDataRight from '../../event-editor/composite/EventEditorDataRight';
import EventEditorTimes from '../../event-editor/composite/EventEditorTimes';
import { EditorUpdateFields } from '../../event-editor/EventEditor';
import { useEventSelection } from '../useEventSelection';

import style from './EventEditor.module.scss';

export default function EventEditor() {
  const selectedEvents = useEventSelection((state) => state.selectedEvents);
  const { data } = useRundown();
  const { updateEvent } = useEventAction();

  const [event, setEvent] = useState<OntimeEvent | null>(null);

  useEffect(() => {
    if (!data) {
      setEvent(null);
      return;
    }

    const event = data.find((event) => selectedEvents.has(event.id));

    if (event && isOntimeEvent(event)) {
      setEvent(event);
    }
  }, [data, selectedEvents]);

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
      <div>HEADER ACTIONS?</div>
      <div className={style.content}>
        <EventEditorTimes
          eventId={event.id}
          timeStart={event.timeStart}
          timeEnd={event.timeEnd}
          duration={event.duration}
          delay={event.delay ?? 0}
          isPublic={event.isPublic}
          endAction={event.endAction}
          timerType={event.timerType}
          timeWarning={event.timeWarning}
          timeDanger={event.timeDanger}
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
        />
      </div>
      <div>
        {/** TODO: update this with changes from alex */}
        <CopyTag label='Event ID'>{event.id}</CopyTag>
        <CopyTag label='OSC trigger by id'>{`/ontime/gotoid "${event.id}"`}</CopyTag>
        <CopyTag label='OSC trigger by cue'>{`/ontime/gotocue "${event.cue}"`}</CopyTag>
      </div>
    </div>
  );
}
