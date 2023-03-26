import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import { Playback } from 'ontime-types';

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
  actionHandler: (action: EventItemActions, payload?: any) => void;
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

  const handleRef = useRef<null | HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasRendered = useRef(false);

  const {
    isDragging,
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    animateLayoutChanges: () => true,
    id: eventId,
  });

  const dragStyle = {
    zIndex: isDragging ? 2 : 1,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const binderColours = colour && getAccessibleColour(colour);

  useEffect(() => {
    if (hasCursor) {
      handleRef?.current?.focus();
    }
  }, [hasCursor]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          hasRendered.current = true;
        }
      },
      {
        root: null,
        threshold: 0.3,
      },
    );

    const saveRef = handleRef.current;

    if (saveRef) {
      observer.observe(handleRef.current);
    }

    return () => {
      if (saveRef) {
        observer.unobserve(saveRef);
      }
    };
  }, []);

  const blockClasses = cx([
    style.eventBlock,
    skip ? style.skip : null,
    selected ? style.selected : null,
    hasCursor ? style.hasCursor : null,
  ]);

  return (
    <div className={blockClasses} ref={setNodeRef} style={dragStyle}>
      <div
        className={style.binder}
        style={{ ...binderColours }}
        tabIndex={-1}
        onClick={() => actionHandler('set-cursor', index)}
      >
        <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
          <IoReorderTwo />
        </span>
        {eventIndex}
      </div>
      {(isVisible || hasRendered) && (
        <EventBlockInner
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
