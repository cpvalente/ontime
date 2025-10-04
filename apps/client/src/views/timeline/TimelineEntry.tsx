import { RefObject } from 'react';

import { useExpectedStartData, useTimer } from '../../common/hooks/useSocket';
import { getProgress } from '../../common/utils/getProgress';
import { alpha, cx } from '../../common/utils/styleUtils';
import { formatDuration, formatTime, getExpectedTimesFromExtendedEvent } from '../../common/utils/time';
import { useTranslation } from '../../translation/TranslationProvider';

import { getStatusLabel } from './timeline.utils';

import style from './Timeline.module.scss';

export type ProgressStatus = 'done' | 'live' | 'future';

interface TimelineEntryProps {
  colour: string;
  delay: number;
  duration: number;
  hasLink: boolean;
  left: number;
  status: ProgressStatus;
  start: number;
  dayOffset: number;
  totalGap: number;
  isLinkedToLoaded: boolean;
  title: string;
  width: number;
  ref?: RefObject<HTMLDivElement | null>;
}

const formatOptions = {
  format12: 'hh:mm a',
  format24: 'HH:mm',
};

export function TimelineEntry({
  colour,
  delay,
  duration,
  hasLink,
  left,
  status,
  start,
  dayOffset,
  totalGap,
  isLinkedToLoaded,
  title,
  width,
  ref,
}: TimelineEntryProps) {
  const formattedStartTime = formatTime(start, formatOptions);
  const formattedDuration = formatDuration(duration);
  const delayedStart = start + delay;
  const hasDelay = delay > 0;

  const lighterColour = alpha(colour, 0.7);
  const showTitle = width > 25;
  const smallArea = width < 40;

  return (
    <div
      ref={ref}
      className={cx([style.column, smallArea && style.smallArea])}
      style={{
        '--color': colour,
        '--lighter': lighterColour ?? '',
        left: `${left}px`,
        width: `${width}px`,
      }}
    >
      {status === 'live' ? <ActiveBlock /> : <div data-status={status} className={style.timelineBlock} />}
      <div
        className={cx([style.content, width < 20 && style.hide, !hasLink && style.separeLeft])}
        data-status={status}
        style={{
          '--color': colour,
        }}
      >
        <div className={style.maybeInline}>
          <div className={cx([hasDelay && style.cross])}>{formattedStartTime}</div>
          {hasDelay && <div className={style.delay}>{formatTime(delayedStart, formatOptions)}</div>}
          {smallArea && (
            <TimelineEntryStatus
              delay={delay}
              start={start}
              dayOffset={dayOffset}
              totalGap={totalGap}
              isLinkedToLoaded={isLinkedToLoaded}
              status={status}
            />
          )}
        </div>
        {showTitle && (
          <>
            {!smallArea && (
              <TimelineEntryStatus
                delay={delay}
                start={start}
                dayOffset={dayOffset}
                totalGap={totalGap}
                isLinkedToLoaded={isLinkedToLoaded}
                status={status}
              />
            )}
            <div>{title}</div>
          </>
        )}
      </div>
      <div className={style.timeOverview} data-status={status}>
        {status !== 'done' && <div className={style.duration}>{formattedDuration}</div>}
      </div>
    </div>
  );
}

interface TimelineEntryStatusProps {
  delay: number;
  start: number;
  dayOffset: number;
  totalGap: number;
  isLinkedToLoaded: boolean;
  status: ProgressStatus;
}

// extract component to isolate re-renders provoked by the clock changes
function TimelineEntryStatus({
  delay,
  start,
  dayOffset,
  totalGap,
  isLinkedToLoaded,
  status,
}: TimelineEntryStatusProps) {
  const state = useExpectedStartData();

  const { getLocalizedString } = useTranslation();

  const { timeToStart } = getExpectedTimesFromExtendedEvent(
    { timeStart: start, delay, dayOffset, totalGap, isLinkedToLoaded },
    state,
  );

  let statusText = getStatusLabel(timeToStart, status);
  if (statusText === 'live') {
    statusText = getLocalizedString('timeline.live');
  } else if (statusText === 'pending') {
    statusText = getLocalizedString('timeline.due');
  }

  return <div className={style.status}>{statusText}</div>;
}

/** Generates a block level progress bar */
function ActiveBlock() {
  const { current, duration } = useTimer();
  const progress = getProgress(current, duration);
  return <div data-status='live' className={style.timelineBlock} style={{ '--progress': `${progress}%` }} />;
}
