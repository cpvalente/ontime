import { dayInMs, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { useTimelineStatus, useTimer } from '../../common/hooks/useSocket';
import { getProgress } from '../../common/utils/getProgress';
import { alpha, cx } from '../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../common/utils/time';
import { calculateTimeUntilStart } from '../../common/utils/timeuntil';
import { useTranslation } from '../../translation/TranslationProvider';

import style from './Timeline.module.scss';

export type ProgressStatus = 'done' | 'live' | 'future';

interface TimelineEntryProps {
  colour: string;
  delay: number;
  duration: number;
  left: number;
  status: ProgressStatus;
  start: number;
  title: string;
  width: number;
  totalGap: number;
  normalisedDayOffset: number;
  isNext: boolean;
  isLinked: boolean;
}

const formatOptions = {
  format12: 'hh:mm a',
  format24: 'HH:mm',
};

export function TimelineEntry(props: TimelineEntryProps) {
  const {
    colour,
    delay,
    duration,
    left,
    status,
    start,
    title,
    width,
    totalGap,
    normalisedDayOffset,
    isNext,
    isLinked,
  } = props;
  const { getLocalizedString } = useTranslation();

  const formattedStartTime = formatTime(start, formatOptions);
  const formattedDuration = formatDuration(duration);
  const delayedStart = start + delay;
  const hasDelay = delay > 0;

  const lighterColour = alpha(colour, 0.7);
  const columnClasses = cx([style.column, width < 40 && style.smallArea]);
  const contentClasses = cx([style.content, width < 20 && style.hide]);
  const showTitle = width > 25;

  return (
    <div
      className={columnClasses}
      style={{
        '--color': colour,
        '--lighter': lighterColour ?? '',
        left: `${left}px`,
        width: `${width}px`,
      }}
    >
      {status === 'live' ? <ActiveBlock /> : <div data-status={status} className={style.timelineBlock} />}
      <div
        className={contentClasses}
        data-status={status}
        style={{
          '--color': colour,
        }}
      >
        <div className={hasDelay ? style.cross : undefined}>{formattedStartTime}</div>
        {hasDelay && <div className={style.delay}>{formatTime(delayedStart, formatOptions)}</div>}
        {showTitle && <div>{title}</div>}
      </div>
      <div className={style.timeOverview} data-status={status}>
        {status !== 'done' && (
          <>
            <div className={style.duration}>{formattedDuration}</div>
            {status === 'live' ? (
              <div className={style.status}>{getLocalizedString('timeline.live')}</div>
            ) : (
              <TimelineEntryStatus
                totalGap={totalGap}
                normalisedTimeStart={start + normalisedDayOffset * dayInMs}
                isLinkedAndNext={isNext && isLinked}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface TimelineEntryStatusProps {
  normalisedTimeStart: number;
  totalGap: number;
  isLinkedAndNext: boolean;
}

// extract component to isolate re-renders provoked by the clock changes
function TimelineEntryStatus(props: TimelineEntryStatusProps) {
  const { normalisedTimeStart, totalGap, isLinkedAndNext } = props;
  const { clock, offset } = useTimelineStatus();
  const { getLocalizedString } = useTranslation();

  const timeUntil = calculateTimeUntilStart(normalisedTimeStart, totalGap, isLinkedAndNext, clock, offset);
  const isDue = timeUntil < MILLIS_PER_SECOND;

  const timeUntilString = isDue
    ? getLocalizedString('timeline.due').toUpperCase()
    : `${formatDuration(Math.abs(timeUntil), timeUntil > 2 * MILLIS_PER_MINUTE)}`;

  return <div className={style.status}>{timeUntilString}</div>;
}

/** Generates a block level progress bar */
function ActiveBlock() {
  const { current, duration } = useTimer();
  const progress = getProgress(current, duration);
  return <div data-status='live' className={style.timelineBlock} style={{ '--progress': `${progress}%` }} />;
}
