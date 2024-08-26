import { memo } from 'react';
import { useViewportSize } from '@mantine/hooks';
import { isOntimeEvent, MaybeNumber, OntimeEvent } from 'ontime-types';
import { checkIsNextDay, dayInMs, getLastEvent, MILLIS_PER_HOUR } from 'ontime-utils';

import { useTimelineOverview } from '../../../common/hooks/useSocket';

import TimelineMarkers from './timeline-markers/TimelineMarkers';
import ProgressBar from './timeline-progress-bar/TimelineProgressBar';
import { getElementPosition, getEndHour, getStartHour } from './timeline.utils';
import { ProgressStatus, TimelineEntry } from './TimelineEntry';

import style from './Timeline.module.scss';

interface TimelineProps {
  selectedEventId: string | null;
  rundown: OntimeEvent[];
}

export default memo(Timeline);

function Timeline(props: TimelineProps) {
  const { selectedEventId, rundown } = props;
  const { width: screenWidth } = useViewportSize();
  const { plannedStart, plannedEnd } = useTimelineOverview();

  if (plannedStart === null || plannedEnd === null) {
    return null;
  }

  const { lastEvent } = getLastEvent(rundown);
  const startHour = getStartHour(plannedStart);
  const endHour = getEndHour(plannedEnd + (lastEvent?.delay ?? 0));

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
          // TODO: timeline must accumulate normalised time over days
          const isNextDay =
            previousEventStartTime !== null
              ? checkIsNextDay(previousEventStartTime, event.timeStart, event.duration)
              : false;
          const normalisedStart = hasTimelinePassedMidnight || isNextDay ? event.timeStart + dayInMs : event.timeStart;
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
              start={normalisedStart} // dataset solves issues related to crossing midnight
              title={event.title}
              width={elementWidth}
            />
          );
        })}
      </div>
    </div>
  );
}
