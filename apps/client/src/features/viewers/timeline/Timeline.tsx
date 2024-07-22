import { memo } from 'react';
import { useViewportSize } from '@mantine/hooks';
import { isOntimeEvent, MaybeNumber } from 'ontime-types';
import { dayInMs, getFirstEventNormal, getLastEventNormal, MILLIS_PER_HOUR } from 'ontime-utils';

import useRundown from '../../../common/hooks-query/useRundown';

import TimelineMarkers from './timeline-markers/TimelineMarkers';
import ProgressBar from './timeline-progress-bar/TimelineProgressBar';
import { getElementPosition, getEndHour, getStartHour } from './timeline.utils';
import { ProgressStatus, TimelineEntry } from './TimelineEntry';

import style from './Timeline.module.scss';

function useTimeline() {
  const { data } = useRundown();
  if (data.revision === -1) {
    return null;
  }

  const { firstEvent } = getFirstEventNormal(data.rundown, data.order);
  const { lastEvent } = getLastEventNormal(data.rundown, data.order);
  const firstStart = firstEvent?.timeStart ?? 0;
  const lastEnd = lastEvent?.timeEnd ?? 0;
  const normalisedLastEnd = lastEnd < firstStart ? lastEnd + dayInMs : lastEnd;

  // timeline is padded to nearest hours (floor and ceil)
  const startHour = getStartHour(firstStart) * MILLIS_PER_HOUR;
  const endHour = getEndHour(normalisedLastEnd) * MILLIS_PER_HOUR;
  const accumulatedDelay = lastEvent?.delay ?? 0;

  return {
    rundown: data.rundown,
    order: data.order,
    startHour,
    endHour,
    accumulatedDelay,
  };
}

interface TimelineProps {
  selectedEventId: string | null;
}

export default memo(Timeline);

function Timeline(props: TimelineProps) {
  const { selectedEventId } = props;
  const { width: screenWidth } = useViewportSize();
  const timelineData = useTimeline();

  if (timelineData === null) {
    return null;
  }

  const { rundown, order, startHour, endHour, accumulatedDelay } = timelineData;

  let hasTimelinePassedMidnight = false;
  let previousEventStartTime: MaybeNumber = null;
  let eventStatus: ProgressStatus = 'done';

  return (
    <div className={style.timeline}>
      <TimelineMarkers />
      <ProgressBar startHour={startHour} endHour={endHour + accumulatedDelay} />
      <div className={style.timelineEvents}>
        {order.map((eventId) => {
          // for now we dont render delays and blocks
          const event = rundown[eventId];
          if (!isOntimeEvent(event)) {
            return null;
          }

          // keep track of progress of rundown
          if (eventStatus === 'live') {
            eventStatus = 'future';
          }
          if (eventId === selectedEventId) {
            eventStatus = 'live';
          }

          // we need to offset the start to account for midnight
          if (!hasTimelinePassedMidnight) {
            hasTimelinePassedMidnight = previousEventStartTime !== null && event.timeStart < previousEventStartTime;
          }
          const normalisedStart = hasTimelinePassedMidnight ? event.timeStart + dayInMs : event.timeStart;
          previousEventStartTime = normalisedStart;

          const { left: elementLeftPosition, width: elementWidth } = getElementPosition(
            startHour,
            endHour + accumulatedDelay,
            normalisedStart + (event.delay ?? 0),
            event.duration,
            screenWidth,
          );

          return (
            <TimelineEntry
              key={eventId}
              colour={event.colour}
              delay={event.delay ?? 0}
              duration={event.duration}
              left={elementLeftPosition}
              status={eventStatus}
              start={event.timeStart}
              title={event.title}
              width={elementWidth}
            />
          );
        })}
      </div>
    </div>
  );
}
