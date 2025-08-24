import { MouseEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  IoAdd,
  IoDuplicateOutline,
  IoFolder,
  IoLink,
  IoReorderTwo,
  IoSwapVertical,
  IoTrash,
  IoUnlink,
} from 'react-icons/io5';
import { TbClockPin, TbFlagFilled } from 'react-icons/tb';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EndAction, EntryId, Playback, TimerType, TimeStrategy } from 'ontime-types';
import { isPlaybackActive } from 'ontime-utils';

import { useContextMenu } from '../../../common/hooks/useContextMenu';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { useEventIdSwapping } from '../useEventIdSwapping';
import { getSelectionMode, useEventSelection } from '../useEventSelection';

import RundownEventInner from './RundownEventInner';
import RundownIndicators from './RundownIndicators';

import style from './RundownEvent.module.scss';

interface RundownEventProps {
  eventId: EntryId;
  cue: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: boolean;
  flag: boolean;
  countToEnd: boolean;
  eventIndex: number;
  endAction: EndAction;
  timerType: TimerType;
  title: string;
  note: string;
  delay: number;
  colour: string;
  isPast: boolean;
  isNext: boolean;
  skip: boolean;
  parent: EntryId | null;
  loaded: boolean;
  hasCursor: boolean;
  playback?: Playback;
  isRolling: boolean;
  gap: number;
  isNextDay: boolean;
  dayOffset: number;
  totalGap: number;
  isLinkedToLoaded: boolean;
  createCloneEvent: () => void;
  hasTriggers: boolean;
}

export default function RundownEvent({
  eventId,
  cue,
  timeStart,
  timeEnd,
  duration,
  timeStrategy,
  linkStart,
  flag,
  countToEnd,
  eventIndex,
  endAction,
  timerType,
  title,
  note,
  delay,
  colour,
  isPast,
  isNext,
  skip = false,
  parent,
  loaded,
  hasCursor,
  playback,
  isRolling,
  gap,
  isNextDay,
  dayOffset,
  totalGap,
  isLinkedToLoaded,
  hasTriggers,
  createCloneEvent,
}: RundownEventProps) {
  const { selectedEventId, setSelectedEventId, clearSelectedEventId } = useEventIdSwapping();
  const { updateEntry, batchUpdateEvents, deleteEntry, groupEntries, swapEvents, matchGroupDuration } =
    useEntryActions();

  const { selectedEvents, unselect, setSelectedEvents, clearSelectedEvents } = useEventSelection();
  const handleRef = useRef<null | HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const [onContextMenu] = useContextMenu<HTMLDivElement>(
    selectedEvents.size > 1
      ? [
          {
            type: 'item',
            label: 'Link to previous',
            icon: IoLink,
            onClick: () => {
              batchUpdateEvents({ linkStart: true }, Array.from(selectedEvents));
            },
          },
          {
            type: 'item',
            label: 'Unlink from previous',
            icon: IoUnlink,
            onClick: () => {
              batchUpdateEvents({ linkStart: false }, Array.from(selectedEvents));
            },
          },
          { type: 'divider' },
          {
            type: 'item',
            label: 'Group',
            icon: IoFolder,
            onClick: () => {
              groupEntries(Array.from(selectedEvents));
              clearSelectedEvents();
            },
            disabled: parent !== null,
          },
          { type: 'divider' },
          {
            type: 'item',
            label: 'Delete',
            icon: IoTrash,
            onClick: () => {
              clearSelectedEvents();
              deleteEntry(Array.from(selectedEvents));
            },
          },
        ]
      : [
          {
            type: 'item',
            label: flag ? 'Remove flag' : 'Add flag',
            icon: TbFlagFilled,
            onClick: () => {
              updateEntry({ id: eventId, flag: !flag });
            },
          },
          {
            type: 'item',
            label: 'Match Target Group Duration',
            icon: TbClockPin,
            onClick: () => {
              if (!parent) return;
              matchGroupDuration(eventId, parent);
            },
            disabled: !parent,
          },
          { type: 'divider' },
          {
            type: 'item',
            label: 'Add to swap',
            icon: IoAdd,
            onClick: () => setSelectedEventId(eventId),
          },
          {
            type: 'item',
            label: `Swap this event with ${selectedEventId ?? ''}`,
            icon: IoSwapVertical,
            onClick: () => {
              if (!selectedEventId) return;
              swapEvents({ from: selectedEventId, to: eventId });
              clearSelectedEventId();
            },
            disabled: selectedEventId == null || selectedEventId === eventId,
          },
          {
            type: 'item',
            label: 'Clone',
            icon: IoDuplicateOutline,
            onClick: createCloneEvent,
          },
          { type: 'divider' },
          {
            type: 'item',
            label: 'Delete',
            icon: IoTrash,
            onClick: () => {
              deleteEntry([eventId]);
              unselect(eventId);
            },
          },
        ],
  );

  const {
    isDragging,
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: eventId,
    data: {
      type: 'event',
      parent,
    },
    animateLayoutChanges: () => false,
  });

  const dragStyle = {
    zIndex: isDragging ? 2 : 'inherit',
    cursor: isDragging ? 'grabbing' : 'grab',
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const binderColours = colour && getAccessibleColour(colour);

  // move focus to element if necessary
  useEffect(() => {
    if (!hasCursor || handleRef?.current == null) {
      return;
    }

    const elementInFocus = document.activeElement;
    // we know the group is the grandparent of our binder
    const blockElement = handleRef.current.closest('#event-group');

    // we only move focus if the block doesnt already contain focus
    if (blockElement && !blockElement.contains(elementInFocus)) {
      handleRef.current.focus();
    }
  }, [hasCursor]);

  useLayoutEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        root: null,
        threshold: 1,
      },
    );

    const handleRefCurrent = handleRef.current;
    if (handleRefCurrent) {
      observer.observe(handleRefCurrent);
    }

    return () => {
      if (handleRefCurrent) {
        observer.unobserve(handleRefCurrent);
      }
    };
  }, [handleRef]);

  const isSelected = selectedEvents.has(eventId);
  const blockClasses = cx([
    style.rundownEvent,
    skip ? style.skip : null,
    isPast ? style.past : null,
    loaded ? style.loaded : null,
    playback ? style[playback] : null,
    isSelected ? style.selected : null,
    hasCursor ? style.hasCursor : null,
  ]);

  const handleFocusClick = (event: MouseEvent) => {
    event.stopPropagation();

    // event.button === 2 is a right-click
    // disable selection if the user selected events and right clicks
    // so the context menu shows up
    if (selectedEvents.size > 1 && event.button === 2) {
      return;
    }

    // UI indexes are 1 based
    const index = eventIndex - 1;
    const editMode = getSelectionMode(event);
    setSelectedEvents({ id: eventId, index, selectMode: editMode });
  };

  const isPlaying = playback ? isPlaybackActive(playback) : false;

  return (
    <div
      className={blockClasses}
      ref={setNodeRef}
      style={dragStyle}
      onClick={handleFocusClick}
      onContextMenu={onContextMenu}
      data-testid='rundown-event'
      {...(isPlaying ? { 'data-running': true } : {})}
    >
      <RundownIndicators timeStart={timeStart} delay={delay} gap={gap} isNextDay={isNextDay} />

      <div className={style.binder} style={{ ...binderColours }} tabIndex={-1}>
        <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
          <IoReorderTwo />
        </span>
        <span className={style.cue}>{cue}</span>
      </div>

      {isVisible && (
        <RundownEventInner
          timeStart={timeStart}
          timeEnd={timeEnd}
          duration={duration}
          linkStart={linkStart}
          countToEnd={countToEnd}
          timeStrategy={timeStrategy}
          eventId={eventId}
          eventIndex={eventIndex}
          endAction={endAction}
          timerType={timerType}
          title={title}
          note={note}
          delay={delay}
          isNext={isNext}
          skip={skip}
          loaded={loaded}
          playback={playback}
          isRolling={isRolling}
          dayOffset={dayOffset}
          isPast={isPast}
          totalGap={totalGap}
          isLinkedToLoaded={isLinkedToLoaded}
          hasTriggers={hasTriggers}
        />
      )}
    </div>
  );
}
