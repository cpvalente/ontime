import { memo } from 'react';
import { useViewportSize } from '@mantine/hooks';
import { isOntimeEvent, MaybeNumber, OntimeEvent } from 'ontime-types';
import { dayInMs, getFirstEvent, getLastEvent, MILLIS_PER_HOUR } from 'ontime-utils';

import TimelineMarkers from './timeline-markers/TimelineMarkers';
import ProgressBar from './timeline-progress-bar/TimelineProgressBar';
import { getElementPosition, getEndHour, getStartHour } from './timeline.utils';
import { ProgressStatus, TimelineEntry } from './TimelineEntry';

import style from './Timeline.module.scss';

function useTimeline(rundown: OntimeEvent[]) {
  const { firstEvent } = getFirstEvent(rundown);
  const { lastEvent } = getLastEvent(rundown);
  const firstStart = firstEvent?.timeStart ?? 0;
  const lastEnd = lastEvent?.timeEnd ?? 0;
  const normalisedLastEnd = lastEnd < firstStart ? lastEnd + dayInMs : lastEnd;

  // we make sure the end accounts for delays
  const accumulatedDelay = lastEvent?.delay ?? 0;
  // timeline is padded to nearest hours (floor and ceil)
  const startHour = getStartHour(firstStart);
  const endHour = getEndHour(normalisedLastEnd + accumulatedDelay);

  return {
    rundown: rundown,
    startHour,
    endHour,
  };
}

interface TimelineProps {
  selectedEventId: string | null;
  rundown: OntimeEvent[];
}

export default memo(Timeline);

function Timeline(props: TimelineProps) {
  const { selectedEventId, rundown: baseRundown } = props;
  const { width: screenWidth } = useViewportSize();
  const timelineData = useTimeline(baseRundown);

  if (timelineData === null) {
    return null;
  }

  const { rundown, startHour, endHour } = timelineData;

  let hasTimelinePassedMidnight = false;
  let previousEventStartTime: MaybeNumber = null;
  // we use selectedEventId as a signifier on whether the timeline is live
  let eventStatus: ProgressStatus = selectedEventId ? 'done' : 'future';

  return (
    <div className={style.timeline}>
      <TimelineMarkers startHour={startHour} endHour={endHour} />
      <ProgressBar startHour={startHour} endHour={endHour} />
      <div className={style.timelineEvents}>
        {rundown.map((event) => {
          // for now we dont render delays and blocks
          if (!isOntimeEvent(event)) {
            return null;
          }

          // keep track of progress of rundown
          if (eventStatus === 'live') {
            eventStatus = 'future';
          }
          if (event.id === selectedEventId) {
            eventStatus = 'live';
          }

          if (!hasTimelinePassedMidnight) {
            // we need to offset the start to account for midnight
            hasTimelinePassedMidnight = previousEventStartTime !== null && event.timeStart < previousEventStartTime;
          }
          const normalisedStart = hasTimelinePassedMidnight ? event.timeStart + dayInMs : event.timeStart;
          previousEventStartTime = normalisedStart;

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
              start={normalisedStart} // solve issues related to crossing midnight
              title={event.title}
              width={elementWidth}
            />
          );
        })}
      </div>
    </div>
  );
}
