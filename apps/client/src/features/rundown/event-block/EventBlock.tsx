import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import { OntimeEvent, Playback } from 'ontime-types';

import { useCursor } from '../../../common/stores/cursorStore';
import { useEventEditorStore } from '../../../common/stores/eventEditor';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { EventItemActions } from '../RundownEntry';

import EventBlockInner from './EventBlockInner';

import style from './EventBlock.module.scss';

interface EventBlockProps {
  timeStart: number;
  timeEnd: number;
  duration: number;
  index: number;
  eventIndex: number;
  eventId: string;
  isPublic: boolean;
  title: string;
  note: string;
  delay: number;
  previousEnd: number;
  colour: string;
  next: boolean;
  skip: boolean;
  selected: boolean;
  hasCursor: boolean;
  playback?: Playback;
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
    timeStart,
    timeEnd,
    duration,
    index,
    eventIndex,
    eventId,
    isPublic = true,
    title,
    note,
    delay,
    previousEnd,
    colour,
    next,
    skip = false,
    selected,
    hasCursor,
    playback,
    actionHandler,
  } = props;

  const moveCursorTo = useCursor((state) => state.moveCursorTo);
  const handleRef = useRef<null | HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const openId = useEventEditorStore((state) => state.openId);

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

  useEffect(() => {
    if (hasCursor) {
      handleRef?.current?.focus();
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
    selected ? style.selected : null,
    hasCursor ? style.hasCursor : null,
  ]);

  return (
    <div className={blockClasses} ref={setNodeRef} style={dragStyle}>
      <div className={style.binder} style={{ ...binderColours }} tabIndex={-1} onClick={() => moveCursorTo(index)}>
        <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
          <IoReorderTwo />
        </span>
        {eventIndex}
      </div>
      {isVisible && (
        <EventBlockInner
          isOpen={openId === eventId}
          timeStart={timeStart}
          timeEnd={timeEnd}
          duration={duration}
          eventId={eventId}
          isPublic={isPublic}
          title={title}
          note={note}
          delay={delay}
          previousEnd={previousEnd}
          next={next}
          skip={skip}
          selected={selected}
          playback={playback}
          actionHandler={actionHandler}
        />
      )}
    </div>
  );
}
