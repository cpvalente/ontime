import { useLayoutEffect, useRef, useState } from 'react';
import { isOntimeEvent ,OntimeEvent } from 'ontime-types';

import useRundown from '../../common/hooks-query/useRundown';

import style from './Timeline.module.scss';

export default function Timeline() {
  const { data } = useRundown();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

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

  return (
    <div className={style.timelineContainer}>
      <div className={style.timeline} ref={elementRef}>
        {events.map((event) => {
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
