import { CustomFieldLabel, OntimeEvent } from 'ontime-types';

import EventEditorEmpty from './EventEditorEmpty';

import style from './EventEditor.module.scss';
import MobileEventEditorTimes from './composite/MobileEventEditorTimes';

export type EventEditorSubmitActions = keyof OntimeEvent;

export type EditorUpdateFields = 'cue' | 'title' | 'note' | 'colour' | CustomFieldLabel;

interface EventEditorProps {
  event: OntimeEvent;
}

export default function MobileEventEditor(props: EventEditorProps) {
  const { event } = props;

  if (!event) {
    return <EventEditorEmpty />;
  }

  return (
    <div className={style.content}>
      <MobileEventEditorTimes
        key={`${event.id}-times`}
        eventId={event.id}
        timeStart={event.timeStart}
        timeEnd={event.timeEnd}
        duration={event.duration}
        timeStrategy={event.timeStrategy}
        linkStart={event.linkStart}
        countToEnd={event.countToEnd}
        delay={event.delay ?? 0}
        endAction={event.endAction}
      />
    </div>
  );
}
