import { useCallback } from 'react';
import { isOntimeEvent, OntimeEvent, OntimeRundownEntry, Playback, SupportedEvent } from 'ontime-types';
import { calculateDuration, getCueCandidate } from 'ontime-utils';

import { RUNDOWN_TABLE } from '../../common/api/apiConstants';
import { useEventAction } from '../../common/hooks/useEventAction';
import useRundown from '../../common/hooks-query/useRundown';
import { ontimeQueryClient } from '../../common/queryClient';
import { useAppMode } from '../../common/stores/appModeStore';
import { useEditorSettings } from '../../common/stores/editorSettings';
import { useEmitLog } from '../../common/stores/logger';
import { cloneEvent } from '../../common/utils/eventsManager';

import BlockBlock from './block-block/BlockBlock';
import DelayBlock from './delay-block/DelayBlock';
import EventBlock from './event-block/EventBlock';
import { useEventSelection } from './useEventSelection';

export type EventItemActions = 'set-cursor' | 'event' | 'delay' | 'block' | 'delete' | 'clone' | 'update' | 'swap';

interface RundownEntryProps {
  type: SupportedEvent;
  isPast: boolean;
  data: OntimeRundownEntry;
  selected: boolean;
  eventIndex: number;
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
    eventIndex,
  } = props;
  const { emitError } = useEmitLog();
  const { addEvent, updateEvent, batchUpdateEvents, deleteEvent, swapEvents } = useEventAction();
  const { data: rundown = [] } = useRundown();
  const { cursor } = useAppMode();
  const { eventsToEdit, clearEventsToEdit } = useEventSelection();

  const removeOpenEvent = useCallback(() => {
    if (eventsToEdit.some((id) => id.id === data.id)) {
      clearEventsToEdit();
    }

    if (cursor === data.id) {
      // setCursor(null);
    }
  }, [cursor, data.id, eventsToEdit, clearEventsToEdit]);

  const { eventSettings } = useEditorSettings();
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
          return addEvent(newEvent, options);
        }
        case 'delay': {
          return addEvent({ type: SupportedEvent.Delay }, { after: data.id });
        }
        case 'block': {
          return addEvent({ type: SupportedEvent.Block }, { after: data.id });
        }
        case 'swap': {
          const { value } = payload as FieldValue;
          return swapEvents({ from: value as string, to: data.id });
        }
        case 'delete': {
          if (eventsToEdit.some((id) => id.id === data.id)) {
            removeOpenEvent();
          }
          return deleteEvent(data.id);
        }
        case 'clone': {
          const newEvent = cloneEvent(data as OntimeEvent, data.id);
          newEvent.cue = getCueCandidate(ontimeQueryClient.getQueryData(RUNDOWN_TABLE) || [], data.id);
          return addEvent(newEvent);
        }
        case 'update': {
          // Handles and filters update requests
          const { field, value } = payload as FieldValue;
          const newData: Partial<OntimeEvent> = { id: data.id };

          // if selected events are more than one
          // we need to bulk edit
          if (eventsToEdit.length > 1) {
            const changes: Partial<OntimeEvent> = { [field]: value };
            const idsOfRundownEvents = rundown.filter(isOntimeEvent).map((event) => event.id);

            const eventIds = eventsToEdit.map((event) => event.id);
            // check every selected event id to see if they match rundown event ids
            const areIdsValid = eventIds.every((eventId) => idsOfRundownEvents.includes(eventId));

            if (!areIdsValid) {
              return;
            }

            batchUpdateEvents(changes, eventIds);
            return clearEventsToEdit();
          }

          if (field === 'durationOverride' && data.type === SupportedEvent.Event) {
            // duration defines timeEnd
            newData.duration = value as number;
            newData.timeEnd = data.timeStart + (value as number);
            return updateEvent(newData);
          }

          if (field === 'timeStart' && data.type === SupportedEvent.Event) {
            newData.duration = calculateDuration(value as number, data.timeEnd);
            newData.timeStart = value as number;
            return updateEvent(newData);
          }

          if (field === 'timeEnd' && data.type === SupportedEvent.Event) {
            newData.duration = calculateDuration(data.timeStart, value as number);
            newData.timeEnd = value as number;
            return updateEvent(newData);
          }

          if (field in data) {
            // @ts-expect-error not sure how to type this
            newData[field] = value;
            return updateEvent(newData);
          }

          return emitError(`Unknown field: ${field}`);
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
      previousEventId,
      removeOpenEvent,
      clearEventsToEdit,
      startTimeIsLastEnd,
      updateEvent,
      batchUpdateEvents,
      eventsToEdit,
      swapEvents,
      rundown,
    ],
  );

  if (data.type === SupportedEvent.Event) {
    return (
      <EventBlock
        eventIndex={eventIndex}
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
      />
    );
  } else if (data.type === SupportedEvent.Block) {
    return <BlockBlock data={data} hasCursor={hasCursor} actionHandler={actionHandler} />;
  } else if (data.type === SupportedEvent.Delay) {
    return <DelayBlock data={data} hasCursor={hasCursor} actionHandler={actionHandler} />;
  }
  return null;
}
