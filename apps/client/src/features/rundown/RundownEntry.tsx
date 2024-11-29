import { useCallback } from 'react';
import { OntimeEvent, OntimeRundownEntry, Playback, SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../common/hooks/useEventAction';
import useMemoisedFn from '../../common/hooks/useMemoisedFn';
import useReportAction from '../../common/hooks/useReportActions';
import { useEmitLog } from '../../common/stores/logger';
import { cloneEvent } from '../../common/utils/eventsManager';

import BlockBlock from './block-block/BlockBlock';
import DelayBlock from './delay-block/DelayBlock';
import EventBlock from './event-block/EventBlock';
import { useEventSelection } from './useEventSelection';

export type EventItemActions =
  | 'set-cursor'
  | 'event'
  | 'event-before'
  | 'delay'
  | 'delay-before'
  | 'block'
  | 'block-before'
  | 'delete'
  | 'clone'
  | 'update'
  | 'swap'
  | 'clear-report'
  | 'clear-all-reports';

interface RundownEntryProps {
  type: SupportedEvent;
  isPast: boolean;
  data: OntimeRundownEntry;
  loaded: boolean;
  eventIndex: number;
  hasCursor: boolean;
  isNext: boolean;
  previousStart?: number;
  previousEnd?: number;
  previousEventId?: string;
  playback?: Playback; // we only care about this if this event is playing
  isRolling: boolean; // we need to know even if not related to this event
}

export default function RundownEntry(props: RundownEntryProps) {
  const {
    isPast,
    data,
    loaded,
    hasCursor,
    isNext,
    previousStart,
    previousEnd,
    previousEventId,
    playback,
    isRolling,
    eventIndex,
  } = props;
  const { emitError } = useEmitLog();
  const { addEvent, updateEvent, batchUpdateEvents, deleteEvent, swapEvents } = useEventAction();
  const reportAction = useReportAction();
  const { selectedEvents, unselect, clearSelectedEvents } = useEventSelection();

  const removeOpenEvent = useCallback(() => {
    unselect(data.id);
  }, [unselect, data.id]);

  const clearMultiSelection = useCallback(() => {
    clearSelectedEvents();
  }, [clearSelectedEvents]);

  // Create / delete new events
  type FieldValue = {
    field: keyof Omit<OntimeEvent, 'duration'> | 'durationOverride';
    value: unknown;
  };

  const actionHandler = useMemoisedFn((action: EventItemActions, payload?: number | FieldValue) => {
    switch (action) {
      case 'event': {
        const newEvent = { type: SupportedEvent.Event };
        const options = {
          after: data.id,
          lastEventId: previousEventId,
        };
        return addEvent(newEvent, options);
      }
      case 'event-before': {
        const newEvent = { type: SupportedEvent.Event };
        const options = {
          after: previousEventId,
        };
        return addEvent(newEvent, options);
      }
      case 'delay': {
        return addEvent({ type: SupportedEvent.Delay }, { after: data.id });
      }
      case 'delay-before': {
        return addEvent({ type: SupportedEvent.Delay }, { after: previousEventId });
      }
      case 'block': {
        return addEvent({ type: SupportedEvent.Block }, { after: data.id });
      }
      case 'block-before': {
        return addEvent({ type: SupportedEvent.Block }, { after: previousEventId });
      }
      case 'swap': {
        const { value } = payload as FieldValue;
        return swapEvents({ from: value as string, to: data.id });
      }
      case 'delete': {
        if (selectedEvents.size > 1) {
          clearMultiSelection();
          return deleteEvent(Array.from(selectedEvents));
        }
        removeOpenEvent();
        return deleteEvent([data.id]);
      }
      case 'clear-report': {
        reportAction.clear(data.id);
        break;
      }
      case 'clear-all-reports': {
        reportAction.clearAll();
        break;
      }
      case 'clone': {
        const newEvent = cloneEvent(data as OntimeEvent, data.id);
        addEvent(newEvent, { after: data.id });
        break;
      }
      case 'update': {
        // Handles and filters update requests
        const { field, value } = payload as FieldValue;
        if (field === undefined || value === undefined) {
          return;
        }
        const newData: Partial<OntimeEvent> = { id: data.id };

        // if selected events are more than one
        // we need to bulk edit
        if (selectedEvents.size > 1) {
          const changes: Partial<OntimeEvent> = { [field]: value };
          batchUpdateEvents(changes, Array.from(selectedEvents));
          return;
        }
        if (field in data) {
          // @ts-expect-error -- not sure how to type this
          newData[field] = value;
          return updateEvent(newData);
        }

        return emitError(`Unknown field: ${field}`);
      }
      default:
        throw new Error(`Unhandled event ${action}`);
    }
  });

  if (data.type === SupportedEvent.Event) {
    return (
      <EventBlock
        eventIndex={eventIndex}
        cue={data.cue}
        timeStart={data.timeStart}
        timeEnd={data.timeEnd}
        duration={data.duration}
        timeStrategy={data.timeStrategy}
        linkStart={data.linkStart}
        eventId={data.id}
        isPublic={data.isPublic}
        endAction={data.endAction}
        timerType={data.timerType}
        title={data.title}
        note={data.note}
        delay={data.delay ?? 0}
        previousStart={previousStart}
        previousEnd={previousEnd}
        colour={data.colour}
        isPast={isPast}
        isNext={isNext}
        skip={data.skip}
        loaded={loaded}
        hasCursor={hasCursor}
        playback={playback}
        isRolling={isRolling}
        actionHandler={actionHandler}
      />
    );
  } else if (data.type === SupportedEvent.Block) {
    return <BlockBlock data={data} hasCursor={hasCursor} onDelete={() => actionHandler('delete')} />;
  } else if (data.type === SupportedEvent.Delay) {
    return <DelayBlock data={data} hasCursor={hasCursor} />;
  }
  return null;
}
