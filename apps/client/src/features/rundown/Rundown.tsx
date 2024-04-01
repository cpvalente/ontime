import { Fragment, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  MaybeNumber,
  Playback,
  RundownCached,
  SupportedEvent,
} from 'ontime-types';
import { getFirstNormal, getLastNormal, getNextNormal, getPreviousNormal } from 'ontime-utils';

import { useEventAction } from '../../common/hooks/useEventAction';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useRundownEditor } from '../../common/hooks/useSocket';
import { AppMode, useAppMode } from '../../common/stores/appModeStore';
import { useEditorSettings } from '../../common/stores/editorSettings';
import { useEventCopy } from '../../common/stores/eventCopySore';
import { cloneEntry, cloneEvent } from '../../common/utils/eventsManager';

import QuickAddBlock from './quick-add-block/QuickAddBlock';
import RundownEmpty from './RundownEmpty';
import { useEventSelection } from './useEventSelection';

import style from './Rundown.module.scss';

const RundownEntry = lazy(() => import('./RundownEntry'));

type KeyCombo = { altKey: boolean; ctrlKey: boolean; shiftKey: boolean; code: string };
const checkKeys = (event: KeyboardEvent, keyCombo: KeyCombo) => {
  return (
    keyCombo.altKey === event.altKey &&
    keyCombo.ctrlKey === event.ctrlKey &&
    keyCombo.shiftKey === event.shiftKey &&
    keyCombo.code === event.code
  );
};

const keyCombos = {
  selectUp: (event: KeyboardEvent) =>
    checkKeys(event, { altKey: true, ctrlKey: false, shiftKey: false, code: 'ArrowUp' }),
  selectDown: (event: KeyboardEvent) =>
    checkKeys(event, { altKey: true, ctrlKey: false, shiftKey: false, code: 'ArrowDown' }),
  reorderUp: (event: KeyboardEvent) =>
    checkKeys(event, { altKey: true, ctrlKey: true, shiftKey: false, code: 'ArrowUp' }),
  reorderDown: (event: KeyboardEvent) =>
    checkKeys(event, { altKey: true, ctrlKey: true, shiftKey: false, code: 'ArrowDown' }),
  addEventUp: (event: KeyboardEvent) =>
    checkKeys(event, { altKey: true, ctrlKey: false, shiftKey: true, code: 'KeyE' }),
  addEventDown: (event: KeyboardEvent) =>
    checkKeys(event, { altKey: true, ctrlKey: false, shiftKey: false, code: 'KeyE' }),
  addDelayUp: (event: KeyboardEvent) =>
    checkKeys(event, { altKey: true, ctrlKey: false, shiftKey: true, code: 'KeyD' }),
  addDelayDown: (event: KeyboardEvent) =>
    checkKeys(event, { altKey: true, ctrlKey: false, shiftKey: false, code: 'KeyD' }),
  addBlockUp: (event: KeyboardEvent) =>
    checkKeys(event, { altKey: true, ctrlKey: false, shiftKey: true, code: 'KeyB' }),
  addBlockDown: (event: KeyboardEvent) =>
    checkKeys(event, { altKey: true, ctrlKey: false, shiftKey: false, code: 'KeyB' }),
  copy: (event: KeyboardEvent) => checkKeys(event, { altKey: false, ctrlKey: true, shiftKey: false, code: 'KeyC' }),
  pastUp: (event: KeyboardEvent) => checkKeys(event, { altKey: false, ctrlKey: true, shiftKey: true, code: 'KeyV' }),
  pastDown: (event: KeyboardEvent) => checkKeys(event, { altKey: false, ctrlKey: true, shiftKey: false, code: 'KeyV' }),
  deleteEntry: (event: KeyboardEvent) =>
    checkKeys(event, { altKey: true, ctrlKey: false, shiftKey: false, code: 'Backspace' }),
} as const;

interface RundownProps {
  data: RundownCached;
}

export default function Rundown({ data }: RundownProps) {
  const { order, rundown } = data;
  const [statefulEntries, setStatefulEntries] = useState(order);
  const { eventCopyId, setEventCopyId } = useEventCopy();

  const featureData = useRundownEditor();
  const { addEvent, reorderEvent, deleteEvent } = useEventAction();
  const eventSettings = useEditorSettings((state) => state.eventSettings);
  const defaultPublic = eventSettings.defaultPublic;
  const linkPrevious = eventSettings.linkPrevious;
  const showQuickEntry = eventSettings.showQuickEntry;

  // cursor
  const { cursor, mode: appMode, setCursor } = useAppMode();
  const { setSelectedEvents, clearSelectedEvents } = useEventSelection();
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useFollowComponent({ followRef: cursorRef, scrollRef, doFollow: appMode === AppMode.Run });

  // DND KIT
  const sensors = useSensors(useSensor(PointerSensor));

  const insertAtCursor = useCallback(
    (type: SupportedEvent | 'clone', cursor: string | null) => {
      if (cursor === null) {
        // we cant clone without selection
        if (type === 'clone') {
          return;
        }
        // the only thing to do is adding an event at top
        addEvent({ type });
        return;
      }

      if (type === 'clone') {
        const cursorEvent = rundown[cursor];
        if (cursorEvent?.type === SupportedEvent.Event) {
          const newEvent = cloneEvent(cursorEvent, cursorEvent.id);
          addEvent(newEvent);
        }
      } else if (type === SupportedEvent.Event) {
        const newEvent = {
          type: SupportedEvent.Event,
        };
        const options = {
          after: cursor,
          defaultPublic,
          lastEventId: cursor,
          linkPrevious,
        };
        addEvent(newEvent, options);
      } else {
        addEvent({ type }, { after: cursor });
      }
    },
    [addEvent, rundown, defaultPublic, linkPrevious],
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // handle held key
      if (event.repeat) return;

      if (event.code == 'Escape') {
        setCursor(null);
        clearSelectedEvents();
        return;
      }

      if (!(event.ctrlKey || event.altKey || event.shiftKey)) return;

      let comboFlag = true;

      if (keyCombos.selectUp(event)) {
        const { entry, index } = cursor ? getPreviousNormal(rundown, order, cursor) : getLastNormal(rundown, order);
        if (entry && index !== null) {
          setCursor(entry.id);
          setSelectedEvents({ id: entry.id, index, selectMode: 'click' });
        }
      } else if (keyCombos.selectDown(event)) {
        const { entry, index } = cursor ? getNextNormal(rundown, order, cursor) : getFirstNormal(rundown, order);
        if (entry && index !== null) {
          setCursor(entry.id);
          setSelectedEvents({ id: entry.id, index, selectMode: 'click' });
        }
      } else if (keyCombos.reorderUp(event)) {
        if (order.length < 2 || cursor == null) return;
        const { entry, index } = getPreviousNormal(rundown, order, cursor);
        if (entry && index !== null) {
          reorderEvent(cursor, index + 1, index);
        }
      } else if (keyCombos.reorderDown(event)) {
        if (order.length < 2 || cursor == null) return;
        const { entry, index } = getNextNormal(rundown, order, cursor);
        if (entry && index !== null) {
          reorderEvent(cursor, index - 1, index);
        }
      } else if (keyCombos.addEventUp(event)) {
        const after = cursor ? getPreviousNormal(rundown, order, cursor).entry?.id : undefined;
        if (after) {
          insertAtCursor(SupportedEvent.Event, after);
        } else {
          addEvent({ type: SupportedEvent.Event });
        }
      } else if (keyCombos.addEventDown(event)) {
        if (cursor) {
          insertAtCursor(SupportedEvent.Event, cursor);
        } else {
          const after = getLastNormal(rundown, order).entry?.id;
          addEvent({ type: SupportedEvent.Event }, { after });
        }
      } else if (keyCombos.addBlockUp(event)) {
        const after = cursor ? getPreviousNormal(rundown, order, cursor).entry?.id : undefined;
        if (after) {
          insertAtCursor(SupportedEvent.Block, after);
        } else {
          addEvent({ type: SupportedEvent.Block });
        }
      } else if (keyCombos.addBlockDown(event)) {
        if (cursor) {
          insertAtCursor(SupportedEvent.Block, cursor);
        } else {
          const after = getLastNormal(rundown, order).entry?.id;
          addEvent({ type: SupportedEvent.Block }, { after });
        }
      } else if (keyCombos.addDelayUp(event)) {
        const after = cursor ? getPreviousNormal(rundown, order, cursor).entry?.id : undefined;
        if (after) {
          insertAtCursor(SupportedEvent.Delay, after);
        } else {
          addEvent({ type: SupportedEvent.Delay });
        }
      } else if (keyCombos.addDelayDown(event)) {
        if (cursor) {
          insertAtCursor(SupportedEvent.Delay, cursor);
        } else {
          const after = getLastNormal(rundown, order).entry?.id;
          addEvent({ type: SupportedEvent.Delay }, { after });
        }
      } else if (keyCombos.copy(event)) {
        setEventCopyId(cursor);
      } else if (keyCombos.pastUp(event)) {
        if (!eventCopyId) return;
        const copyEntry = rundown[eventCopyId];
        const after = cursor ? getPreviousNormal(rundown, order, cursor).entry?.id : undefined;
        const newEntry = cloneEntry(copyEntry, after);
        addEvent(newEntry);
        setEventCopyId(null);
      } else if (keyCombos.pastDown(event)) {
        if (!eventCopyId) return;
        const copyEntry = rundown[eventCopyId];
        const after = cursor ? cursor : getLastNormal(rundown, order).entry?.id;
        const newEntry = cloneEntry(copyEntry, after);
        addEvent(newEntry);
      } else if (keyCombos.deleteEntry(event)) {
        if (!cursor) return;
        const previous = getPreviousNormal(rundown, order, cursor).entry?.id ?? null;
        //TODO: should we add a confirmation?
        deleteEvent(cursor);
        setCursor(previous);
      } else {
        comboFlag = false;
      }

      if (comboFlag) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
    [
      setCursor,
      clearSelectedEvents,
      cursor,
      rundown,
      order,
      setSelectedEvents,
      reorderEvent,
      insertAtCursor,
      addEvent,
      setEventCopyId,
      eventCopyId,
      deleteEvent,
    ],
  );

  // we copy the state from the store here
  // to workaround async updates on the drag mutations
  useEffect(() => {
    setStatefulEntries(order);
  }, [order]);

  // listen to keys
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    // in run mode, we follow selection
    if (appMode !== AppMode.Run || !featureData?.selectedEventId) {
      return;
    }
    setCursor(featureData.selectedEventId);
  }, [appMode, featureData.selectedEventId, setCursor]);

  const handleOnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over?.id) {
      if (active.id !== over?.id) {
        const fromIndex = active.data.current?.sortable.index;
        const toIndex = over.data.current?.sortable.index;
        // ugly hack to handle inconsistencies between dnd-kit and async store updates
        setStatefulEntries((currentEntries) => {
          return arrayMove(currentEntries, fromIndex, toIndex);
        });
        reorderEvent(String(active.id), fromIndex, toIndex);
      }
    }
  };

  if (statefulEntries.length < 1) {
    return <RundownEmpty handleAddNew={() => insertAtCursor(SupportedEvent.Event, null)} />;
  }

  let previousStart: MaybeNumber = null;
  let previousEnd: MaybeNumber = null;
  let previousEventId: string | undefined;
  let thisStart: MaybeNumber = null;
  let thisEnd: MaybeNumber = null;
  let thisId = previousEventId;

  let eventIndex = 0;
  // all events before the current selected are in the past
  let isPast = Boolean(featureData?.selectedEventId);

  return (
    <div className={style.eventContainer} ref={scrollRef} data-testid='rundown'>
      <DndContext onDragEnd={handleOnDragEnd} sensors={sensors} collisionDetection={closestCenter}>
        <SortableContext items={statefulEntries} strategy={verticalListSortingStrategy}>
          <div className={style.list}>
            {statefulEntries.map((eventId, index) => {
              // we iterate through a stateful copy of order to make the operations smoother
              // this means that this can be out of sync with order until the useEffect runs
              // instead of writing all the logic guards, we simply short circuit rendering here
              const event = rundown[eventId];
              if (!event) {
                return null;
              }
              if (index === 0) {
                eventIndex = 0;
              }
              if (isOntimeEvent(event)) {
                // event indexes are 1 based in frontend
                eventIndex++;
                previousStart = thisStart;
                previousEnd = thisEnd;
                previousEventId = thisId;

                if (!event.skip) {
                  thisStart = event.timeStart;
                  thisEnd = event.timeEnd;
                  thisId = eventId;
                }
              }
              const isLast = index === order.length - 1;
              const isLoaded = featureData?.selectedEventId === event.id;
              const isNext = featureData?.nextEventId === event.id;
              const hasCursor = event.id === cursor;
              if (isLoaded) {
                isPast = false;
              }

              return (
                <Fragment key={event.id}>
                  <div className={style.entryWrapper} data-testid={`entry-${eventIndex}`}>
                    {isOntimeEvent(event) && <div className={style.entryIndex}>{eventIndex}</div>}
                    <div className={style.entry} key={event.id} ref={hasCursor ? cursorRef : undefined}>
                      <RundownEntry
                        type={event.type}
                        isPast={isPast}
                        eventIndex={eventIndex}
                        data={event}
                        loaded={isLoaded}
                        hasCursor={hasCursor}
                        isNext={isNext}
                        previousStart={previousStart}
                        previousEnd={previousEnd}
                        previousEventId={previousEventId}
                        playback={isLoaded ? featureData.playback : undefined}
                        isRolling={featureData.playback === Playback.Roll}
                      />
                    </div>
                  </div>
                  {((showQuickEntry && hasCursor) || isLast) && (
                    <QuickAddBlock
                      showKbd={hasCursor}
                      previousEventId={event.id}
                      disableAddDelay={isOntimeDelay(event)}
                      disableAddBlock={isOntimeBlock(event)}
                    />
                  )}
                </Fragment>
              );
            })}
            <div className={style.spacer} />
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
