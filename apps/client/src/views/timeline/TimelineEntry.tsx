import { RefObject } from 'react';

import { useTimelineStatus, useTimer } from '../../common/hooks/useSocket';
import { getProgress } from '../../common/utils/getProgress';
import { alpha, cx } from '../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../common/utils/time';
import { useTranslation } from '../../translation/TranslationProvider';

import { getStatusLabel, getTimeToStart } from './timeline.utils';

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
          {smallArea && <TimelineEntryStatus delay={delay} start={start} status={status} />}
        </div>
        {showTitle && (
          <>
            {!smallArea && <TimelineEntryStatus delay={delay} start={start} status={status} />}
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
  status: ProgressStatus;
}

// extract component to isolate re-renders provoked by the clock changes
function TimelineEntryStatus({ delay, start, status }: TimelineEntryStatusProps) {
  const { clock, offset } = useTimelineStatus();
  const { getLocalizedString } = useTranslation();

  // start times need to be normalised in a rundown that crosses midnight
  let statusText = getStatusLabel(getTimeToStart(clock, start, delay, offset), status);
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
