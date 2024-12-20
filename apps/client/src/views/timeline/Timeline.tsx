import { memo } from 'react';
import { useViewportSize } from '@mantine/hooks';
import { isOntimeEvent, isPlayableEvent, OntimeRundown } from 'ontime-types';
import { dayInMs, getLastEvent, MILLIS_PER_HOUR } from 'ontime-utils';

import TimelineMarkers from './timeline-markers/TimelineMarkers';
import { getElementPosition, getEndHour, getStartHour } from './timeline.utils';
import { ProgressStatus, TimelineEntry } from './TimelineEntry';

import style from './Timeline.module.scss';

interface TimelineProps {
  firstStart: number;
  rundown: OntimeRundown;
  selectedEventId: string | null;
  totalDuration: number;
}

export default memo(Timeline);

function Timeline(props: TimelineProps) {
  const { firstStart, rundown, selectedEventId, totalDuration } = props;
  const { width: screenWidth } = useViewportSize();

  if (totalDuration === 0) {
    return null;
  }

  const { lastEvent } = getLastEvent(rundown);
  const startHour = getStartHour(firstStart);
  const endHour = getEndHour(firstStart + totalDuration + (lastEvent?.delay ?? 0));

  // we use selectedEventId as a signifier on whether the timeline is live
  let eventStatus: ProgressStatus = selectedEventId ? 'done' : 'future';

  return (
    <div className={style.timeline}>
      <TimelineMarkers startHour={startHour} endHour={endHour} />
      {rundown.map((event) => {
        // for now we dont render delays and blocks
        if (!isOntimeEvent(event) || !isPlayableEvent(event)) {
          return null;
        }

        // keep track of progress of rundown
        if (eventStatus === 'live') {
          eventStatus = 'future';
        }
        if (event.id === selectedEventId) {
          eventStatus = 'live';
        }

        const normalisedStart = event.timeStart + (event.dayOffset ?? 0) * dayInMs;

        const { left: elementLeftPosition, width: elementWidth } = getElementPosition(
          startHour * MILLIS_PER_HOUR,
          endHour * MILLIS_PER_HOUR,
          normalisedStart + (event.delay ?? 0),
          event.duration,
          screenWidth,
        );

        return (
          <TimelineEntry
            key={event.id}
            colour={event.colour}
            delay={event.delay ?? 0}
            duration={event.duration}
            left={elementLeftPosition}
            status={eventStatus}
            start={normalisedStart} // dataset solves issues related to crossing midnight
            title={event.title}
            width={elementWidth}
          />
        );
      })}
    </div>
  );
}
