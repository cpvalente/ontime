import { memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useViewportSize } from '@mantine/hooks';
import { isOntimeEvent, MaybeNumber } from 'ontime-types';
import { dayInMs, getFirstEventNormal, getLastEventNormal, MILLIS_PER_HOUR } from 'ontime-utils';

import useRundown from '../../../common/hooks-query/useRundown';
import { isStringBoolean } from '../../viewers/common/viewUtils';

import { type ProgressStatus, TimelineEntry } from './TimelineEntry';
import { TimelineMarkers } from './TimelineMarkers';
import { ProgressBar } from './TimelineProgressBar';
import { getElementPosition, getEndHour, getEstimatedWidth, getLaneLevel, getStartHour } from './timelineUtils';

import style from './Timeline.module.scss';

export default memo(Timeline);

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

  return {
    rundown: data.rundown,
    order: data.order,
    startHour,
    endHour,
  };
}

interface TimelineProps {
  selectedEventId: string | null;
}

function Timeline(props: TimelineProps) {
  const { selectedEventId } = props;
  const { width: screenWidth } = useViewportSize();
  const timelineData = useTimeline();
  const [searchParams] = useSearchParams();
  const fullHeight = isStringBoolean(searchParams.get('fullHeight'));

  if (timelineData === null) {
    return null;
  }

  const { rundown, order, startHour, endHour } = timelineData;

  let hasTimelinePassedMidnight = false;
  let previousEventStartTime: MaybeNumber = null;
  let eventStatus: ProgressStatus = 'finished';
  // a list of the right most element for each lane
  const rightMostElements: Record<number, number> = {};

  return (
    <div className={style.timeline}>
      <TimelineMarkers />
      <ProgressBar startHour={startHour} endHour={endHour} />
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
            endHour,
            normalisedStart,
            event.duration,
            screenWidth,
          );
          const estimatedWidth = getEstimatedWidth(event.title);
          const estimatedRightPosition = elementLeftPosition + estimatedWidth;
          const laneLevel = getLaneLevel(rightMostElements, elementLeftPosition);

          if (rightMostElements[laneLevel] === undefined || rightMostElements[laneLevel] < estimatedRightPosition) {
            rightMostElements[laneLevel] = estimatedRightPosition;
          }

          return (
            <TimelineEntry
              key={eventId}
              colour={event.colour}
              duration={event.duration}
              isLast={eventId === order[order.length - 1]}
              lane={laneLevel}
              left={elementLeftPosition}
              status={eventStatus}
              start={event.timeStart}
              title={event.title}
              width={elementWidth}
              mayGrow={elementWidth < estimatedWidth}
              fullHeight={fullHeight}
            />
          );
        })}
      </div>
    </div>
  );
}
