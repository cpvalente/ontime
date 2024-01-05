import { useCallback } from 'react';
import { GetRundownCached, OntimeEvent, OntimeRundownEntry, Playback, SupportedEvent } from 'ontime-types';
import { calculateDuration, getCueCandidate } from 'ontime-utils';

import { RUNDOWN } from '../../common/api/apiConstants';
import { useEventAction } from '../../common/hooks/useEventAction';
import { ontimeQueryClient } from '../../common/queryClient';
import { useAppMode } from '../../common/stores/appModeStore';
import { useEditorSettings } from '../../common/stores/editorSettings';
import { useEmitLog } from '../../common/stores/logger';
import { cloneEvent } from '../../common/utils/eventsManager';

import BlockBlock from './block-block/BlockBlock';
import DelayBlock from './delay-block/DelayBlock';
import EventBlock from './event-block/EventBlock';

export type EventItemActions = 'set-cursor' | 'event' | 'delay' | 'block' | 'delete' | 'clone' | 'update' | 'swap';

interface RundownEntryProps {
  type: SupportedEvent;
  isPast: boolean;
  isFirstEvent: boolean;
  data: OntimeRundownEntry;
  selected: boolean;
  hasCursor: boolean;
  next: boolean;
  previousEnd: number;
  previousEventId?: string;
  playback?: Playback; // we only care about this if this event is playing
  isRolling: boolean; // we need to know even if not related to this event
  disableEdit: boolean; // we disable edit when the window is extracted
}

export default function RundownEntry(props: RundownEntryProps) {
  const {
    isPast,
    data,
    selected,
    hasCursor,
    next,
    previousEnd,
    previousEventId,
    playback,
    isRolling,
    disableEdit,
    isFirstEvent,
  } = props;
  const { emitError } = useEmitLog();
  const { addEvent, updateEvent, deleteEvent, swapEvents } = useEventAction();

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

  const eventSettings = useEditorSettings((state) => state.eventSettings);
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
        case 'swap': {
          const { value } = payload as FieldValue;
          swapEvents({ from: value as string, to: data.id });

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
          const rundown = ontimeQueryClient.getQueryData<GetRundownCached>(RUNDOWN)?.rundown ?? [];
          newEvent.cue = getCueCandidate(rundown, data.id);
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
      swapEvents,
    ],
  );

  if (data.type === SupportedEvent.Event) {
    return (
      <EventBlock
        cue={data.cue}
        timeStart={data.timeStart}
        timeEnd={data.timeEnd}
        duration={data.duration}
        eventId={data.id}
        isPublic={data.isPublic}
        endAction={data.endAction}
        timerType={data.timerType}
        title={data.title}
        note={data.note}
        delay={data.delay || 0}
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
        isFirstEvent={isFirstEvent}
      />
    );
  } else if (data.type === SupportedEvent.Block) {
    return <BlockBlock data={data} hasCursor={hasCursor} actionHandler={actionHandler} />;
  } else if (data.type === SupportedEvent.Delay) {
    return <DelayBlock data={data} hasCursor={hasCursor} actionHandler={actionHandler} />;
  }
  return null;
}
