import { MouseEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoCopyOutline } from '@react-icons/all-files/io5/IoCopyOutline';
import { IoPeople } from '@react-icons/all-files/io5/IoPeople';
import { IoPeopleOutline } from '@react-icons/all-files/io5/IoPeopleOutline';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import { IoSwapVertical } from '@react-icons/all-files/io5/IoSwapVertical';
import { EndAction, OntimeEvent, Playback, TimerType } from 'ontime-types';

import { useContextMenu } from '../../../common/hooks/useContextMenu';
import useRundown from '../../../common/hooks-query/useRundown';
import copyToClipboard from '../../../common/utils/copyToClipboard';
import { isMacOS } from '../../../common/utils/deviceUtils';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import type { EventItemActions } from '../RundownEntry';
import { useEventIdSwapping } from '../useEventIdSwapping';
import { EditMode, useEventSelection } from '../useEventSelection';

import EventBlockInner from './EventBlockInner';

import style from './EventBlock.module.scss';

const getEditMode = (event: MouseEvent): EditMode => {
  if ((isMacOS() && event.metaKey) || event.ctrlKey) {
    return 'ctrl';
  }

  if (event.shiftKey) {
    return 'shift';
  }

  return 'click';
};

interface EventBlockProps {
  cue: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  eventId: string;
  eventIndex: number;
  isPublic: boolean;
  endAction: EndAction;
  timerType: TimerType;
  title: string;
  note: string;
  delay: number;
  previousEnd: number;
  colour: string;
  isPast: boolean;
  next: boolean;
  skip: boolean;
  selected: boolean;
  hasCursor: boolean;
  playback?: Playback;
  isRolling: boolean;
  actionHandler: (
    action: EventItemActions,
    payload?:
      | number
      | {
          field: keyof Omit<OntimeEvent, 'duration'> | 'durationOverride';
          value: unknown;
        },
  ) => void;
  disableEdit: boolean;
  isFirstEvent: boolean;
}

export default function EventBlock(props: EventBlockProps) {
  const {
    eventId,
    cue,
    timeStart,
    timeEnd,
    duration,
    isPublic = true,
    eventIndex,
    endAction,
    timerType,
    title,
    note,
    delay,
    previousEnd,
    colour,
    isPast,
    next,
    skip = false,
    selected,
    hasCursor,
    playback,
    isRolling,
    actionHandler,
    disableEdit,
    isFirstEvent,
  } = props;
  const { selectedEventId, setSelectedEventId, clearSelectedEventId } = useEventIdSwapping();
  const { selectedEvents, setSelectedEvents } = useEventSelection();
  const { data: rundown = [] } = useRundown();
  const handleRef = useRef<null | HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const [onContextMenu] = useContextMenu<HTMLDivElement>(
    selectedEvents.size > 1
      ? [
          {
            label: 'Visiblity',
            group: [
              {
                label: 'Make public',
                icon: IoPeople,
                onClick: () =>
                  actionHandler('update', {
                    field: 'isPublic',
                    value: true,
                  }),
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
            ],
          },
        ]
      : [
          { label: `Copy ID: ${eventId}`, icon: IoCopyOutline, onClick: () => copyToClipboard(eventId) },
          {
            label: 'Toggle public',
            icon: IoPeopleOutline,
            onClick: () =>
              actionHandler('update', {
                field: 'isPublic',
                value: !isPublic,
              }),
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

  const blockClasses = cx([
    style.eventBlock,
    skip ? style.skip : null,
    isPast ? style.past : null,
    selected ? style.selected : null,
    playback ? style[playback] : null,
    selectedEvents.has(eventId) ? style.hasCursor : null,
  ]);

  const handleFocusClick = (event: MouseEvent) => {
    event.stopPropagation();

    // event.button === 2 is a right-click
    // disable selection if the user selected events and right clicks
    // so the context menu shows up
    if (selectedEvents.size > 1 && event.button === 2) {
      return;
    }

    const editMode = getEditMode(event);
    return setSelectedEvents({ id: eventId, index: eventIndex, rundown, editMode });

    // moveCursorTo(eventId, true);
  };

  return (
    <div
      className={blockClasses}
      ref={setNodeRef}
      style={dragStyle}
      onMouseDown={handleFocusClick}
      onContextMenu={onContextMenu}
      id='event-block'
    >
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
          eventId={eventId}
          eventIndex={eventIndex}
          isPublic={isPublic}
          endAction={endAction}
          timerType={timerType}
          title={title}
          note={note}
          delay={delay}
          previousEnd={previousEnd}
          next={next}
          skip={skip}
          selected={selected}
          playback={playback}
          isRolling={isRolling}
          actionHandler={actionHandler}
          disableEdit={disableEdit}
          isFirstEvent={isFirstEvent}
        />
      )}
    </div>
  );
}
