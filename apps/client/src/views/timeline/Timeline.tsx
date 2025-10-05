import { memo, useMemo, useRef } from 'react';
import { useViewportSize } from '@mantine/hooks';
import { isOntimeEvent, isPlayableEvent, OntimeEntry, PlayableEvent } from 'ontime-types';
import { dayInMs, getLastEvent, MILLIS_PER_HOUR } from 'ontime-utils';

import useHorizontalFollowComponent from '../../common/hooks/useHorizontalFollowComponent';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { cx } from '../../common/utils/styleUtils';

import TimelineMarkers from './timeline-markers/TimelineMarkers';
import { useTimelineOptions } from './timeline.options';
import { calculateTimelineLayout, getEndHour, getStartHour } from './timeline.utils';
import { ProgressStatus, TimelineEntry } from './TimelineEntry';

import style from './Timeline.module.scss';

interface TimelineProps {
  firstStart: number;
  rundown: ExtendedEntry<OntimeEntry>[];
  selectedEventId: string | null;
  totalDuration: number;
}

export default memo(Timeline);
function Timeline({ firstStart, rundown, selectedEventId, totalDuration }: TimelineProps) {
  const { width: screenWidth } = useViewportSize();
  const { hidePast, autosize } = useTimelineOptions();
  const selectedRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { lastEvent } = getLastEvent(rundown);
  const startHour = getStartHour(firstStart);
  const endHour = getEndHour(firstStart + totalDuration + (lastEvent?.delay ?? 0));
  const scheduleStart = startHour * MILLIS_PER_HOUR;
  const scheduleEnd = endHour * MILLIS_PER_HOUR;

  // use horizontal follow when scroll is enabled
  useHorizontalFollowComponent({
    followRef: selectedRef,
    scrollRef: scrollContainerRef,
    doFollow: autosize,
    selectedEventId: selectedEventId,
    // No offset when hiding past events to ensure content starts at 0
    leftOffset: hidePast ? 0 : screenWidth / 6,
  });

  const { positions, totalWidth } = useMemo(() => {
    const playableEvents = rundown
      .filter((event): event is ExtendedEntry<PlayableEvent> => isOntimeEvent(event) && isPlayableEvent(event))
      .map((event) => ({
        start: event.timeStart + (event.dayOffset ?? 0) * dayInMs + (event.delay ?? 0),
        duration: event.duration,
      }));

    return calculateTimelineLayout(playableEvents, scheduleStart, scheduleEnd, screenWidth, autosize);
  }, [rundown, scheduleStart, scheduleEnd, screenWidth, autosize]);

  if (totalDuration === 0) {
    return null;
  }

  // Pre-calculate event statuses
  let currentStatus: ProgressStatus = selectedEventId ? 'done' : 'future';
  const statusMap: Record<string, ProgressStatus> = {};
  rundown.forEach((event) => {
    if (isOntimeEvent(event) && isPlayableEvent(event)) {
      if (currentStatus === 'live') {
        currentStatus = 'future';
      }
      if (event.id === selectedEventId) {
        currentStatus = 'live';
      }
      statusMap[event.id] = currentStatus;
    }
  });

  return (
    <div ref={scrollContainerRef} className={cx([style.timelineContainer, autosize && style.scroll])}>
      <div className={style.timeline} style={{ width: totalWidth }}>
        <TimelineMarkers startHour={startHour} endHour={endHour} />
        {rundown.map((event, index) => {
          if (!isOntimeEvent(event) || !isPlayableEvent(event)) {
            return null;
          }

          const position = positions[index];
          if (!position) return null;

          return (
            <TimelineEntry
              key={event.id}
              ref={event.id === selectedEventId ? selectedRef : undefined}
              colour={event.colour}
              delay={event.delay ?? 0}
              duration={event.duration}
              hasLink={Boolean(event.linkStart)}
              left={position.left}
              status={statusMap[event.id]}
              start={event.timeStart + (event.dayOffset ?? 0) * dayInMs}
              totalGap={event.totalGap}
              isLinkedToLoaded={event.isLinkedToLoaded}
              dayOffset={event.dayOffset}
              title={event.title}
              width={position.width}
            />
          );
        })}
      </div>
    </div>
  );
}
