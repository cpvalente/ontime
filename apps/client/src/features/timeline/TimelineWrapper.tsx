import { isOntimeBlock, isOntimeDelay, isOntimeEvent } from 'ontime-types';
import { getFirstEvent, getLastEvent } from 'ontime-utils';

import { useTimeline, useTimelineCursors } from '../../common/hooks/useSocket';
import useRundown from '../../common/hooks-query/useRundown';
import { cx } from '../../common/utils/styleUtils';

import { getCSSPosition } from './timeline.utils';

import styles from './Timeline.module.scss';

// TODO: isolate in ErrorBoundary
// TODO: add hover element with all the information
export default function TimelineWrapper() {
  const { data } = useRundown();
  const { selectedEventId } = useTimeline();

  // TODO: data to come from backend
  // TODO: data accounts for delays
  const firstStart = getFirstEvent(data)?.timeStart ?? 0;
  // TODO: on last end, we account for delays of runtime if we are running the last event
  const lastEnd = getLastEvent(data)?.timeEnd ?? 0;
  const totalDuration = lastEnd - firstStart;

  // TODO: this will break if users dont have things in order
  // keep cumulative time to help with blocks and delays
  let previousEnd = 0;

  return (
    <>
      <div className={styles.timelineContainer}>
        <TimelineCursors firstStart={firstStart} totalDuration={totalDuration} />
        {data.map((event) => {
          if (isOntimeEvent(event)) {
            previousEnd = event.timeEnd;
            return (
              <TimelineScheduledEvent
                key={event.id}
                firstStart={firstStart}
                lastEnd={lastEnd}
                totalDuration={totalDuration}
                startTime={event.timeStart}
                endTime={event.timeEnd}
                isCurrent={event.id === selectedEventId}
              />
            );
          }
          if (isOntimeDelay(event)) {
            return (
              <TimelineDelay
                key={event.id}
                firstStart={firstStart}
                lastEnd={lastEnd}
                totalDuration={totalDuration}
                startTime={previousEnd}
                duration={event.duration}
              />
            );
          }
          if (isOntimeBlock(event)) {
            return <TimelineBlock key={event.id} />;
          }
          return null;
        })}
      </div>
    </>
  );
}

interface TimelineCursorProps {
  firstStart: number;
  totalDuration: number;
}

function TimelineCursors(props: TimelineCursorProps) {
  const { firstStart, totalDuration } = props;
  const { clock } = useTimelineCursors();

  const elapsed = Math.max(clock - firstStart, 0);
  const currentClock = (elapsed / totalDuration) * 100;

  return <div className={styles.clockCursor} style={{ left: `${currentClock}%` }}></div>;
}

// TODO: add event cue
interface TimelineScheduledEventProps {
  firstStart: number;
  lastEnd: number;
  totalDuration: number;
  startTime: number;
  endTime: number;
  isCurrent: boolean;
}

function TimelineScheduledEvent(props: TimelineScheduledEventProps) {
  const { firstStart, lastEnd, totalDuration, startTime, endTime, isCurrent } = props;

  const position = getCSSPosition({
    scheduleStart: firstStart,
    scheduleEnd: lastEnd,
    eventStart: startTime,
    eventDuration: endTime - startTime,
  });

  const classes = cx([styles.timelineEvent, isCurrent ? styles.isPlaying : null]);
  const positionStyles = {
    left: `${position.left}%`,
    width: `${position.width}%`,
  };
  return (
    <div className={classes} style={positionStyles}>
      event title
    </div>
  );
}

interface TimelineDelayProps {
  firstStart: number;
  lastEnd: number;
  totalDuration: number;
  startTime: number;
  duration: number;
}

function TimelineDelay(props: TimelineDelayProps) {
  const { firstStart, lastEnd, totalDuration, startTime, duration } = props;

  const position = getCSSPosition({
    scheduleStart: firstStart,
    scheduleEnd: lastEnd,
    eventStart: startTime,
    eventDuration: duration,
  });
  const positionStyles = {
    left: `${position.left}%`,
    width: `${position.width}%`,
  };

  return <div className={styles.timelineDelay} style={positionStyles} />;
}

function TimelineBlock() {
  return <div className={styles.timelineBlock}>event title</div>;
}
