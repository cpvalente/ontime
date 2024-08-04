import { useTimelineStatus } from '../../../common/hooks/useSocket';
import { alpha, cx } from '../../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';

import { getStatusLabel } from './timeline.utils';

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
}

const formatOptions = {
  format12: 'hh:mm a',
  format24: 'HH:mm',
};

export function TimelineEntry(props: TimelineEntryProps) {
  const { colour, delay, duration, left, status, start, title, width } = props;

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
            <TimelineEntryStatus status={status} start={delayedStart} />
          </>
        )}
      </div>
    </div>
  );
}

interface TimelineEntryStatusProps {
  status: ProgressStatus;
  start: number;
}

// we isolate this component to avoid isolate re-renders provoked by the clock changes
function TimelineEntryStatus(props: TimelineEntryStatusProps) {
  const { status, start } = props;
  const { clock, offset } = useTimelineStatus();
  const { getLocalizedString } = useTranslation();

  // start times need to be normalised in a rundown that crosses midnight
  let statusText = getStatusLabel(start - clock + offset, status);
  if (statusText === 'live') {
    statusText = getLocalizedString('timeline.live');
  } else if (statusText === 'pending') {
    statusText = getLocalizedString('timeline.due');
  }

  return <div className={style.status}>{statusText}</div>;
}
