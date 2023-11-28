import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoPlayForward } from '@react-icons/all-files/io5/IoPlayForward';
import { IoPlaySkipForward } from '@react-icons/all-files/io5/IoPlaySkipForward';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import { EndAction, OntimeEvent, isOntimeBlock, isOntimeDelay, isOntimeEvent } from 'ontime-types';
import { getFirstEvent, getLastEvent } from 'ontime-utils';

import { useTimeline, useTimelineCursors } from '../../common/hooks/useSocket';
import useRundown from '../../common/hooks-query/useRundown';
import { cx } from '../../common/utils/styleUtils';

import { ElementInfo, useElementInfoStore } from './ElementInfo';
import { getCSSPosition } from './timeline.utils';

import styles from './Timeline.module.scss';

// TODO: isolate in ErrorBoundary
// TODO: add hover element with all the information
export default function TimelineWrapper() {
  const { data } = useRundown();
  const { selectedEventId } = useTimeline();

  const { setIsOpen, setContextMenu } = useElementInfoStore();

  const handleMouseOver = (event) => {
    // TODO: we want to separe the text from the position
    // TODO: text and open set on mouseEnter
    // TODO: position is throttled on mouseOver
    const eventIndex = event.relatedTarget.dataset.index;
    if (eventIndex != null) {
      const scheduledEvent = data[eventIndex] as OntimeEvent;
      setIsOpen(true);
      const el = (
        <>
          {scheduledEvent.cue} <br />
          {scheduledEvent.title} <br />
          {scheduledEvent.timeStart} - {event.timeEnd}
        </>
      );

      console.log(event)
      setContextMenu({ x: event.clientX, y: event.clientY }, el);
    }
  };

  const handleMouseLeave = (event) => {
    setIsOpen(false);
  };

  // TODO: data to come from backend
  // TODO: data accounts for delays
  const firstStart = getFirstEvent(data)?.timeStart ?? 0;
  // TODO: on last end, we account for delays of runtime if we are running the last event
  const lastEnd = getLastEvent(data)?.timeEnd ?? 0;
  const totalDuration = lastEnd - firstStart;

  // TODO: this will break if users dont have things in order
  // keep cumulative time to help with blocks and delays
  let previousEnd = firstStart;

  return (
    <div className={styles.timelineContainer} onMouseOver={handleMouseOver} onMouseLeave={handleMouseLeave}>
      <TimelineCursors firstStart={firstStart} totalDuration={totalDuration} />
      <ElementInfo />
      {data.map((event, index) => {
        if (isOntimeEvent(event)) {
          previousEnd = event.timeEnd;
          return (
            <TimelineScheduledEvent
              key={event.id}
              eventIndex={index}
              cue={event.cue}
              firstStart={firstStart}
              lastEnd={lastEnd}
              startTime={event.timeStart}
              endTime={event.timeEnd}
              isCurrent={event.id === selectedEventId}
              endAction={event.endAction}
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
          return (
            <TimelineBlock
              key={event.id}
              title={event.title}
              firstStart={firstStart}
              lastEnd={lastEnd}
              totalDuration={totalDuration}
              startTime={previousEnd}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

interface TimelineCursorProps {
  firstStart: number;
  totalDuration: number;
}

// TODO: fix playback cursor
function TimelineCursors(props: TimelineCursorProps) {
  const { firstStart, totalDuration } = props;
  const { clock, running, duration } = useTimelineCursors();

  const elapsedClock = Math.max(clock - firstStart, 0);

  const currentClock = (elapsedClock / totalDuration) * 100;
  const currentPlayback = (running ?? 0 / (duration ?? 1)) * 100;

  return (
    <>
      <div className={styles.clockCursor} style={{ left: `${currentClock}%` }} />
      <div className={styles.playbackCursor} style={{ left: `${currentPlayback}%` }} />
    </>
  );
}

// TODO: make shared component
function EndActionIcon(props: { action: EndAction; className?: string }) {
  const { action, className } = props;
  if (action === EndAction.LoadNext) {
    return <IoPlaySkipForward className={className} />;
  }
  if (action === EndAction.PlayNext) {
    return <IoPlayForward className={className} />;
  }
  if (action === EndAction.Stop) {
    return <IoStop className={className} />;
  }
  return <IoPlay className={className} />;
}

interface TimelineScheduledEventProps {
  eventIndex: number;
  cue: string;
  firstStart: number;
  lastEnd: number;
  startTime: number;
  endTime: number;
  isCurrent: boolean;
  endAction: EndAction;
}

// TODO: add user colour
function TimelineScheduledEvent(props: TimelineScheduledEventProps) {
  const { eventIndex, cue, firstStart, lastEnd, startTime, endTime, isCurrent, endAction } = props;

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

  const endPosition = {
    left: `calc(${position.left + position.width}% - 0.125em)`,
  };
  return (
    <>
      <div className={classes} style={positionStyles} data-index={eventIndex}>
        {cue}
      </div>
      <div className={styles.playbackMarker} style={endPosition}>
        <EndActionIcon action={endAction} />
      </div>
    </>
  );
}

interface TimelineDelayProps {
  firstStart: number;
  lastEnd: number;
  totalDuration: number;
  startTime: number;
  duration: number;
}

// TODO: DO
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

interface TimelineBlockProps {
  title: string;
  firstStart: number;
  lastEnd: number;
  totalDuration: number;
  startTime: number;
}

function TimelineBlock(props: TimelineBlockProps) {
  const { title, firstStart, lastEnd, startTime } = props;

  const position = getCSSPosition({
    scheduleStart: firstStart,
    scheduleEnd: lastEnd,
    eventStart: startTime,
    eventDuration: 0,
  });

  const positionStyles = {
    left: `${position.left}%`,
  };

  return (
    <div className={styles.timelineBlock} style={positionStyles}>
      {title}
    </div>
  );
}
