import { useCallback } from 'react';
import { OntimeEvent, OntimeRundownEntry, Playback, SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../common/hooks/useEventAction';
import { useAppMode } from '../../common/stores/appModeStore';
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
  eventIndex: number;
  isPast: boolean;
  data: OntimeRundownEntry;
  selected: boolean;
  hasCursor: boolean;
  next: boolean;
  delay: number;
  previousEnd: number;
  previousEventId?: string;
  playback?: Playback; // we only care about this if this event is playing
  isRolling: boolean; // we need to know even if not related to this event
  disableEdit: boolean; // we disable edit when the window is extracted
}

export default function RundownEntry(props: RundownEntryProps) {
  const {
    eventIndex,
    isPast,
    data,
    selected,
    hasCursor,
    next,
    delay,
    previousEnd,
    previousEventId,
    playback,
    isRolling,
    disableEdit,
  } = props;
  const { emitError } = useEmitLog();
  const { addEvent, updateEvent, deleteEvent } = useEventAction();

  const cursor = useAppMode((state) => state.cursor);
  const setCursor = useAppMode((state) => state.setCursor);
  const openId = useAppMode((state) => state.editId);
  const setEditId = useAppMode((state) => state.setEditId);

  const removeOpenEvent = useCallback(() => {
    if (openId === data.id) {
      setEditId(null);
    }

    if (cursor === data.id) {
      setCursor(null);
    }
  }, [cursor, data.id, openId, setCursor, setEditId]);

  const eventSettings = useLocalEvent((state) => state.eventSettings);
  const defaultPublic = eventSettings.defaultPublic;
  const startTimeIsLastEnd = eventSettings.startTimeIsLastEnd;

  // Create / delete new events
  type FieldValue = {
    field: keyof Omit<OntimeEvent, 'duration'> | 'durationOverride';
    value: unknown;
  };

  // we assume the data is not changing in the lifecycle of this component
  // changes to the data would make rundown re-render, also re-rendering this component
  const actionHandler = useCallback(
    (action: EventItemActions, payload?: number | FieldValue) => {
      switch (action) {
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
          throw new Error(`Unhandled event ${action}`);
      }
    },
    [
      addEvent,
      data,
      defaultPublic,
      deleteEvent,
      emitError,
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
        eventIndex={eventIndex + 1}
        eventId={data.id}
        isPublic={data.isPublic}
        endAction={data.endAction}
        timerType={data.timerType}
        title={data.title}
        note={data.note}
        delay={delay}
        previousEnd={previousEnd}
        colour={data.colour}
        isPast={isPast}
        next={next}
        skip={data.skip}
        selected={selected}
        hasCursor={hasCursor}
        playback={playback}
        isRolling={isRolling}
        actionHandler={actionHandler}
        disableEdit={disableEdit}
      />
    );
  } else if (data.type === SupportedEvent.Block) {
    return <BlockBlock data={data} hasCursor={hasCursor} actionHandler={actionHandler} />;
  } else if (data.type === SupportedEvent.Delay) {
    return <DelayBlock data={data} hasCursor={hasCursor} actionHandler={actionHandler} />;
  }
  return null;
}
