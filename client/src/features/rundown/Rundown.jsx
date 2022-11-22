import { createRef, useCallback, useContext, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Button } from '@chakra-ui/react';
import {
  defaultPublicAtom,
  showQuickEntryAtom,
  startTimeIsLastEndAtom,
} from 'common/atoms/LocalEventSettings';
import Empty from 'common/components/state/Empty';
import { CursorContext } from 'common/context/CursorContext';
import { useEventAction } from 'common/hooks/useEventAction';
import { useRundownEditor } from 'common/hooks/useSocket';
import { duplicateEvent } from 'common/utils/eventsManager';
import { useAtomValue } from 'jotai';
import PropTypes from 'prop-types';

import useSubscription from '../../common/hooks/useSubscription';

import QuickAddBlock from './quick-add-block/QuickAddBlock';
import RundownEntry from './RundownEntry';

import style from './Rundown.module.scss';

export default function Rundown(props) {
  const { entries } = props;
  // Todo: add selectedId and nextId to rundown editor hook
  const { data } = useRundownEditor();
  const { cursor, moveCursorUp, moveCursorDown, moveCursorTo, isCursorLocked } =
    useContext(CursorContext);
  const startTimeIsLastEnd = useAtomValue(startTimeIsLastEndAtom);
  const defaultPublic = useAtomValue(defaultPublicAtom);
  const { addEvent, reorderEvent } = useEventAction();
  const cursorRef = createRef();
  const showQuickEntry = useAtomValue(showQuickEntryAtom);
  const [selectedId] = useSubscription('selected-id', null);
  const [nextId] = useSubscription('next-id', null);

  const insertAtCursor = useCallback(
    (type, cursor) => {
      if (cursor === -1) {
        addEvent({ type: type });
      } else {
        const previousEvent = entries?.[cursor];
        const nextEvent = entries?.[cursor + 1];

        // prevent adding two non-event blocks consecutively
        const isPreviousDifferent = previousEvent?.type !== type;
        const isNextDifferent = nextEvent?.type !== type;
        if (type === 'clone' && previousEvent) {
          const newEvent = duplicateEvent(previousEvent);
          newEvent.after = previousEvent.id;
          addEvent(newEvent);
        } else if (type === 'event') {
          const newEvent = {
            type: 'event',
            after: previousEvent.id,
            isPublic: defaultPublic,
          };
          const options = {
            startIsLastEnd: startTimeIsLastEnd ? previousEvent.id : undefined,
          };
          addEvent(newEvent, options);
        } else if (isPreviousDifferent && isNextDifferent) {
          addEvent({ type: type, after: previousEvent.id });
        }
      }
    },
    [addEvent, defaultPublic, entries, startTimeIsLastEnd],
  );

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback(
    (e) => {
      // handle held key
      // handle held key
      if (e.repeat) return;
      // Check if the alt key is pressed
      if (e.altKey && (!e.ctrlKey || !e.shiftKey)) {
        // Arrow down
        if (e.keyCode === 40) {
          if (cursor < entries.length - 1) moveCursorDown();
        }
        // Arrow up
        if (e.keyCode === 38) {
          if (cursor > 0) moveCursorUp();
        }
        // E
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          if (cursor == null) return;
          insertAtCursor('event', cursor);
        }
        // D
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          if (cursor == null) return;
          insertAtCursor('delay', cursor);
        }
        // B
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          if (cursor == null) return;
          insertAtCursor('block', cursor);
        }
      }
    },
    [cursor, entries.length, insertAtCursor, moveCursorDown, moveCursorUp],
  );

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    if (cursor > entries.length - 1) moveCursorTo(entries.length - 1);
    if (entries.length > 0 && cursor === -1) moveCursorTo(0);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, cursor, entries, moveCursorTo]);

  // when cursor moves, view should follow
  useEffect(() => {
    if (cursorRef.current == null) return;
    cursorRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  }, [cursor]);

  // if selected event
  // or cursor settings changed
  useEffect(() => {
    // and if we are locked
    if (!isCursorLocked || data.selectedEventId == null) return;

    // move cursor
    let gotoIndex = -1;
    let found = false;
    for (const e of entries) {
      gotoIndex++;
      if (e.id === data.selectedEventId) {
        found = true;
        break;
      }
    }
    if (found) {
      // move cursor
      moveCursorTo(gotoIndex);
    }
  }, [data.selectedEventId, isCursorLocked, moveCursorTo]);

  // DND
  const handleOnDragEnd = useCallback(
    (result) => {
      // drop outside of area
      if (!result.destination) return;

      // no change
      if (result.destination === result.source.index) return;

      // Call API
      reorderEvent(result.draggableId, result.source.index, result.destination.index);
    },
    [reorderEvent],
  );

  if (entries.length < 1) {
    return (
      <div className={style.alignCenter}>
        <Empty text='No data yet' style={{ marginTop: '7vh' }} />
        <Button
          onClick={() => insertAtCursor('event', cursor)}
          variant='solid'
          colorScheme='blue'
        >
          Create Event
        </Button>
      </div>
    );
  }
  let cumulativeDelay = 0;
  let eventIndex = -1;
  let previousEnd = 0;
  let thisEnd = 0;
  let previousEventId = null;

  return (
    <div className={style.eventContainer}>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId='eventlist'>
          {(provided) => (
            <div className={style.list} {...provided.droppableProps} ref={provided.innerRef}>
              {entries.map((entry, index) => {
                if (index === 0) {
                  cumulativeDelay = 0;
                  eventIndex = -1;
                }
                if (entry.type === 'delay' && entry.duration != null) {
                  cumulativeDelay += entry.duration;
                } else if (entry.type === 'block') {
                  cumulativeDelay = 0;
                } else if (entry.type === 'event') {
                  eventIndex++;
                  previousEnd = thisEnd;
                  thisEnd = entry.timeEnd;
                  previousEventId = entry.id;
                }
                const isLast = index === entries.length - 1;
                return (
                  <div
                    key={entry.id}
                    className={`${style.bgElement}
                    ${entry.type === 'event' && cumulativeDelay !== 0 ? style.delayed : ''}`}
                  >
                    <div
                      ref={cursor === index ? cursorRef : undefined}
                      className={cursor === index ? style.cursor : ''}
                    >
                      <RundownEntry
                        type={entry.type}
                        index={index}
                        eventIndex={eventIndex}
                        data={entry}
                        selected={selectedId === entry.id}
                        next={nextId === entry.id}
                        delay={cumulativeDelay}
                        previousEnd={previousEnd}
                        playback={selectedId === entry.id ? data.playback : undefined}
                      />
                    </div>
                    {((showQuickEntry && index === cursor) || isLast) && (
                      <QuickAddBlock
                        showKbd={index === cursor}
                        previousId={entry.id}
                        previousEventId={previousEventId}
                        disableAddDelay={entry.type === 'delay'}
                        disableAddBlock={entry.type === 'block'}
                      />
                    )}
                  </div>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

Rundown.propTypes = {
  entries: PropTypes.array,
};
