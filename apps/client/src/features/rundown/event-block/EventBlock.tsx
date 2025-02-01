import { MouseEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoCloseCircle } from '@react-icons/all-files/io5/IoCloseCircle';
import { IoDuplicateOutline } from '@react-icons/all-files/io5/IoDuplicateOutline';
import { IoLink } from '@react-icons/all-files/io5/IoLink';
import { IoPeople } from '@react-icons/all-files/io5/IoPeople';
import { IoPeopleOutline } from '@react-icons/all-files/io5/IoPeopleOutline';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import { IoSwapVertical } from '@react-icons/all-files/io5/IoSwapVertical';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { IoUnlink } from '@react-icons/all-files/io5/IoUnlink';
import { EndAction, MaybeString, OntimeEvent, Playback, TimerType, TimeStrategy } from 'ontime-types';

import { useContextMenu } from '../../../common/hooks/useContextMenu';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import type { EventItemActions } from '../RundownEntry';
import { useEventIdSwapping } from '../useEventIdSwapping';
import { getSelectionMode, useEventSelection } from '../useEventSelection';

import EventBlockInner from './EventBlockInner';
import RundownIndicators from './RundownIndicators';

import style from './EventBlock.module.scss';

interface EventBlockProps {
  eventId: string;
  cue: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: MaybeString;
  countToEnd: boolean;
  eventIndex: number;
  isPublic: boolean;
  endAction: EndAction;
  timerType: TimerType;
  title: string;
  note: string;
  delay: number;
  colour: string;
  isPast: boolean;
  isNext: boolean;
  skip: boolean;
  loaded: boolean;
  hasCursor: boolean;
  playback?: Playback;
  isRolling: boolean;
  gap: number;
  isNextDay: boolean;
  dayOffset: number;
  totalGap: number;
  actionHandler: (
    action: EventItemActions,
    payload?:
      | number
      | {
          field: keyof Omit<OntimeEvent, 'duration'> | 'durationOverride';
          value: unknown;
        },
  ) => void;
}

export default function EventBlock(props: EventBlockProps) {
  const {
    eventId,
    cue,
    timeStart,
    timeEnd,
    duration,
    timeStrategy,
    linkStart,
    countToEnd,
    isPublic = true,
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
    loaded,
    hasCursor,
    playback,
    isRolling,
    gap,
    isNextDay,
    dayOffset,
    totalGap,
    actionHandler,
  } = props;
  const { selectedEventId, setSelectedEventId, clearSelectedEventId } = useEventIdSwapping();
  const { selectedEvents, setSelectedEvents } = useEventSelection();
  const handleRef = useRef<null | HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const [onContextMenu] = useContextMenu<HTMLDivElement>(
    selectedEvents.size > 1
      ? [
          {
            label: 'Link to previous',
            icon: IoLink,
            onClick: () =>
              actionHandler('update', {
                field: 'linkStart',
                value: 'true',
              }),
          },
          {
            label: 'Unlink from previous',
            icon: IoUnlink,
            onClick: () =>
              actionHandler('update', {
                field: 'linkStart',
                value: null,
              }),
          },
          {
            label: 'Make public',
            icon: IoPeople,
            onClick: () =>
              actionHandler('update', {
                field: 'isPublic',
                value: true,
              }),
            withDivider: true,
          },
          {
            label: 'Make private',
            icon: IoPeopleOutline,
            onClick: () =>
              actionHandler('update', {
                field: 'isPublic',
                value: false,
              }),
          },
          { withDivider: true, label: 'Delete', icon: IoTrash, onClick: () => actionHandler('delete') },
        ]
      : [
          {
            label: 'Toggle link to previous',
            icon: IoLink,
            onClick: () =>
              actionHandler('update', {
                field: 'linkStart',
                value: linkStart ? null : 'true',
              }),
          },
          {
            label: 'Toggle public',
            icon: IoPeopleOutline,
            onClick: () =>
              actionHandler('update', {
                field: 'isPublic',
                value: !isPublic,
              }),
            withDivider: true,
          },
          {
            label: 'Add to swap',
            icon: IoAdd,
            onClick: () => setSelectedEventId(eventId),
            withDivider: true,
          },
          {
            label: `Swap this event with ${selectedEventId ?? ''}`,
            icon: IoSwapVertical,
            onClick: () => {
              actionHandler('swap', { field: 'id', value: selectedEventId });
              clearSelectedEventId();
            },
            isDisabled: selectedEventId == null || selectedEventId === eventId,
          },
          { withDivider: false, label: 'Clone', icon: IoDuplicateOutline, onClick: () => actionHandler('clone') },
          {
            withDivider: true,
            label: 'Clear report',
            icon: IoCloseCircle,
            onClick: () => actionHandler('clear-report', { field: 'id', value: eventId }),
          },
          { withDivider: true, label: 'Delete', icon: IoTrash, onClick: () => actionHandler('delete') },
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
    animateLayoutChanges: () => false,
  });

  const dragStyle = {
    zIndex: isDragging ? 2 : 'inherit',
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
    // we know the block is the grandparent of our binder
    const blockElement = handleRef.current.closest('#event-block');

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
    style.eventBlock,
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

  return (
    <div
      className={blockClasses}
      ref={setNodeRef}
      style={dragStyle}
      onClick={handleFocusClick}
      onContextMenu={onContextMenu}
      id='event-block'
    >
      <RundownIndicators timeStart={timeStart} delay={delay} gap={gap} isNextDay={isNextDay} />

      <div className={style.binder} style={{ ...binderColours }} tabIndex={-1}>
        <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
          <IoReorderTwo />
        </span>
        <span className={style.cue}>{cue}</span>
      </div>

      {isVisible && (
        <EventBlockInner
          timeStart={timeStart}
          timeEnd={timeEnd}
          duration={duration}
          linkStart={linkStart}
          countToEnd={countToEnd}
          timeStrategy={timeStrategy}
          eventId={eventId}
          eventIndex={eventIndex}
          isPublic={isPublic}
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
        />
      )}
    </div>
  );
}
