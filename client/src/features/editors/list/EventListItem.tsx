import { useCallback, useContext } from 'react';
import { defaultPublicAtom, startTimeIsLastEndAtom } from 'common/atoms/LocalEventSettings';
import { LoggingContext } from 'common/context/LoggingContext';
import { useEventAction } from 'common/hooks/useEventAction';
import { OntimeEvent, OntimeEventEntry } from 'common/models/EventTypes';
import { Playstate } from 'common/models/OntimeTypes';
import { duplicateEvent } from 'common/utils/eventsManager';
import { calculateDuration } from 'common/utils/timesManager';
import { useAtomValue } from 'jotai';

import { CursorContext } from '../../../common/context/CursorContext';
import BlockBlock from '../block-block/BlockBlock';
import DelayBlock from '../delay-block/DelayBlock';
import EventBlock from '../event-block/EventBlock';

export type EventItemActions =
  'set-cursor'
  | 'event'
  | 'delay'
  | 'block'
  | 'delete'
  | 'clone'
  | 'update'

interface EventListItemProps {
  index: number;
  eventIndex: number;
  data: OntimeEventEntry;
  selected: boolean;
  next: boolean;
  delay: number;
  previousEnd: number;
  playback: Playstate;
}

export default function EventListItem(props: EventListItemProps) {
  const { index, eventIndex, data, selected, next, delay, previousEnd, playback } = props;
  const { emitError } = useContext(LoggingContext);
  const startTimeIsLastEnd = useAtomValue(startTimeIsLastEndAtom);
  const defaultPublic = useAtomValue(defaultPublicAtom);
  const { addEvent, updateEvent, deleteEvent } = useEventAction();
  const { moveCursorTo } = useContext(CursorContext);

  // Create / delete new events
  type FieldValue = {
    field: string;
    value: unknown;
  }
  const actionHandler = useCallback(
    (action: EventItemActions, payload: number | FieldValue) => {
      switch (action) {
        case 'set-cursor': {
          moveCursorTo(payload as number);
          break;
        }
        case 'event': {
          const newEvent = {
            type: 'event',
            after: data.id,
            isPublic: defaultPublic,
          };
          const options = {
            startIsLastEnd: startTimeIsLastEnd ? data.id : undefined,
          };
          addEvent(newEvent, options);
          break;
        }
        case 'delay': {
          addEvent({ type: 'delay', after: data.id });
          break;
        }
        case 'block': {
          addEvent({ type: 'block', after: data.id });
          break;
        }
        case 'delete': {
          deleteEvent(data.id);
          break;
        }
        case 'clone': {
          const newEvent = duplicateEvent(data as OntimeEvent, data.id);
          addEvent(newEvent);
          break;
        }
        case 'update': {
          // Handles and filters update requests
          const { field, value } = payload as FieldValue;
          const newData: Partial<OntimeEvent> = { id: data.id };

          if (field === 'duration' && data.type === 'event') {
            // duration defines timeEnd
            newData.timeEnd = data.timeStart += value as number;
            updateEvent(newData);
          } else if (field === 'timeStart' && data.type === 'event') {
            newData.duration = calculateDuration(value as number, data.timeEnd);
            newData.timeStart = value as number;
            updateEvent(newData);
          } else if (field === 'timeEnd' && data.type === 'event') {
            newData.duration = calculateDuration(data.timeStart, value as number);
            newData.timeEnd = value as number;
            updateEvent(newData);
          } else if (field in data) {
            // @ts-ignore
            newData[field] = value;
            updateEvent(newData);
          } else {
            emitError(`Unknown field: ${field}`);
          }
          break;
        }
        default:
          emitError(`Unknown action called: ${action}`);
          break;
      }
    },
    [
      addEvent,
      calculateDuration,
      data,
      defaultPublic,
      deleteEvent,
      emitError,
      startTimeIsLastEnd,
      updateEvent,
    ],
  );

  if (data.type === 'event') {
    return (
      <EventBlock
        timeStart={data.timeStart}
        timeEnd={data.timeEnd}
        duration={data.duration}
        index={index}
        eventIndex={eventIndex + 1}
        eventId={data.id}
        isPublic={data.isPublic}
        title={data.title}
        note={data.note}
        delay={delay}
        previousEnd={previousEnd}
        colour={data.colour}
        next={next}
        skip={data.skip}
        selected={selected}
        playback={playback}
        actionHandler={actionHandler}
      />
    );
  } else if (data.type === 'block') {
    return <BlockBlock index={index} data={data} actionHandler={actionHandler} />;
  } else if (data.type === 'delay') {
    return <DelayBlock index={index} data={data} actionHandler={actionHandler} />;
  } else {
    return null;
  }
};
