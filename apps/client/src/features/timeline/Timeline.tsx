import { useLayoutEffect, useRef, useState } from 'react';
import { isOntimeEvent, OntimeEvent } from 'ontime-types';

import useRundown from '../../common/hooks-query/useRundown';

import style from './Timeline.module.scss';

interface TimelineData {
  currentId: string | null;
  firstStart: number;
  lastEnd: number;
  clock: number;
}

interface TimelineElementData {
  id: string;
  cue: number;
  colour: string;
  startTime: number;
  endTime: number;
  addedTime: number;
}

interface TimelineElementHoverData {
  id: string;
  cue: number;
  title: number;
  startTime: number;
  endTime: number;
  addedTime: number;
}

export default function Timeline() {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const { data } = useRundown();

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

  const totalDuration: number = data.reduce((total, event) => total + event?.duration ?? 0, 0);

  console.log(totalDuration);

  return (
    <div className={style.timelineContainer}>
      <div className={style.timeline} ref={elementRef}>
        {data.map((event) => {
          const relativeSize = (event.duration * containerWidth ?? 0) / totalDuration;
          console.log({ relativeSize, duration: event.duration, containerWidth, totalDuration });
          return (
            <span key={event.id} style={{ width: `${relativeSize}px` }} className={style.timelineEvent}>
              {event.cue}
            </span>
          );
        })}
      </div>
    </div>
  );
}
