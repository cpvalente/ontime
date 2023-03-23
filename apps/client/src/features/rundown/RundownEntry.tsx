import { useCallback, useContext } from 'react';
import { OntimeEvent, OntimeRundownEntry, Playback, SupportedEvent } from 'ontime-types';

import { CursorContext } from '../../common/context/CursorContext';
import { useEventAction } from '../../common/hooks/useEventAction';
import { useEventEditorStore } from '../../common/stores/eventEditor';
import { useLocalEvent } from '../../common/stores/localEvent';
import { useEmitLog } from '../../common/stores/logger';
import { cloneEvent } from '../../common/utils/eventsManager';
import { calculateDuration } from '../../common/utils/timesManager';

import BlockBlock from './block-block/BlockBlock';
import DelayBlock from './delay-block/DelayBlock';
import EventBlock from './event-block/EventBlock';

export type EventItemActions = 'set-cursor' | 'event' | 'delay' | 'block' | 'delete' | 'clone' | 'update';

interface RundownEntryProps {
  type: SupportedEvent;
  index: number;
  eventIndex: number;
  data: OntimeRundownEntry;
  selected: boolean;
  hasCursor: boolean;
  next: boolean;
  delay: number;
  previousEnd: number;
  previousEventId?: string;
  playback?: Playback; // we only care about this if this event is playing
}

export default function RundownEntry(props: RundownEntryProps) {
  const { index, eventIndex, data, selected, hasCursor, next, delay, previousEnd, previousEventId, playback } = props;
  const { emitError } = useEmitLog();
  const { openId, removeOpenEvent } = useEventEditorStore();
  const { addEvent, updateEvent, deleteEvent } = useEventAction();
  const { moveCursorTo } = useContext(CursorContext);

  const { eventSettings } = useLocalEvent();
  const defaultPublic = eventSettings.defaultPublic;
  const startTimeIsLastEnd = eventSettings.startTimeIsLastEnd;

  // Create / delete new events
  type FieldValue = {
    field: keyof Omit<OntimeEvent, 'duration'> | 'durationOverride';
    value: unknown;
  };
  const actionHandler = useCallback(
    (action: EventItemActions, payload?: number | FieldValue) => {
      switch (action) {
        case 'set-cursor': {
          moveCursorTo(payload as number);
          break;
        }
        case 'event': {
          const newEvent = { type: SupportedEvent.Event };
          const options = {
            startTimeIsLastEnd,
            defaultPublic,
            lastEventId: previousEventId,
            after: data.id,
          };
          addEvent(newEvent, options);
          break;
        }
        case 'delay': {
          addEvent({ type: SupportedEvent.Delay }, { after: data.id });
          break;
        }
        case 'block': {
          addEvent({ type: SupportedEvent.Block }, { after: data.id });
          break;
        }
        case 'delete': {
          if (openId === data.id) {
            removeOpenEvent();
          }
          deleteEvent(data.id);
          break;
        }
        case 'clone': {
          const newEvent = cloneEvent(data as OntimeEvent, data.id);
          addEvent(newEvent);
          break;
        }
        case 'update': {
          // Handles and filters update requests
          const { field, value } = payload as FieldValue;
          const newData: Partial<OntimeEvent> = { id: data.id };

          if (field === 'durationOverride' && data.type === SupportedEvent.Event) {
            // duration defines timeEnd
            newData.duration = value as number;
            newData.timeEnd = data.timeStart + (value as number);
            updateEvent(newData);
          } else if (field === 'timeStart' && data.type === SupportedEvent.Event) {
            newData.duration = calculateDuration(value as number, data.timeEnd);
            newData.timeStart = value as number;
            updateEvent(newData);
          } else if (field === 'timeEnd' && data.type === SupportedEvent.Event) {
            newData.duration = calculateDuration(data.timeStart, value as number);
            newData.timeEnd = value as number;
            updateEvent(newData);
          } else if (field in data) {
            // @ts-expect-error not sure how to type this
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
      data,
      defaultPublic,
      deleteEvent,
      emitError,
      moveCursorTo,
      openId,
      previousEventId,
      removeOpenEvent,
      startTimeIsLastEnd,
      updateEvent,
    ],
  );

  if (data.type === SupportedEvent.Event) {
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
        hasCursor={hasCursor}
        playback={playback}
        actionHandler={actionHandler}
      />
    );
  } else if (data.type === SupportedEvent.Block) {
    // @ts-expect-error -- revise types here
    return <BlockBlock index={index} data={data} hasCursor={hasCursor} actionHandler={actionHandler} />;
  } else if (data.type === SupportedEvent.Delay) {
    // @ts-expect-error -- revise types here
    return <DelayBlock index={index} data={data} hasCursor={hasCursor} actionHandler={actionHandler} />;
  }
  return null;
}
