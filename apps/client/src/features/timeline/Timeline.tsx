import { useLayoutEffect, useRef, useState } from 'react';
import { isOntimeEvent, OntimeEvent } from 'ontime-types';

import useRundown from '../../common/hooks-query/useRundown';

import { ElementInfo, useElementInfoStore } from './ElementInfo';

import style from './Timeline.module.scss';

// TODO: ignore events of 0 duration

export default function Timeline() {
  const { data } = useRundown();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  const { setIsOpen, setContextMenu } = useElementInfoStore();

  useLayoutEffect(() => {
    setContainerWidth(elementRef.current?.getBoundingClientRect().width);
    console.log('debug', elementRef.current);
  }, []);

  useLayoutEffect(() => {
    function handleResize() {
      setContainerWidth(elementRef.current?.getBoundingClientRect().width);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!data) {
    return <>Loading</>;
  }

  const events: OntimeEvent[] = data.filter((event) => isOntimeEvent(event));

  console.log(events);
  const totalDuration: number = events.reduce((total, event) => total + event.duration, 0);

  console.log(totalDuration);

  const handleMouseOver = (event, text) => {
    // TODO: we want to separe the text from the position
    // TODO: text and open set on mouseEnter
    // TODO: position is throttled on mouseOver
    setIsOpen(true);
    setContextMenu({ x: event.clientX, y: event.clientY }, text);
  };

  const handleMouseLeave = (event, text) => {
    setIsOpen(false);
  };

  return (
    <>
      <div className={style.timelineContainer}>
        <div className={style.timeline} ref={elementRef}>
          {events.map((event) => {
            const relativeSize = (event.duration * containerWidth ?? 0) / totalDuration;
            console.log({ relativeSize, duration: event.duration, containerWidth, totalDuration });
            const text = (
              <>
                {event.cue} <br />
                {event.title} <br />
                {event.timeStart} - {event.timeEnd}
              </>
            );
            return (
              <span
                onMouseOver={(event) => handleMouseOver(event, text)}
                onMouseLeave={(event) => handleMouseLeave(event, text)}
                key={event.id}
                style={{ width: `${relativeSize}px` }}
                className={style.timelineEvent}
              >
                {event.cue}
              </span>
            );
          })}
        </div>
      </div>
      <ElementInfo />
    </>
  );
}
