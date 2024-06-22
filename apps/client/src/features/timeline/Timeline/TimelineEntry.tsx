import { useClock } from '../../../common/hooks/useSocket';
import { alpha, cx } from '../../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../../common/utils/time';

import { getStatusLabel } from './timelineUtils';

import style from './Timeline.module.scss';

export type ProgressStatus = 'finished' | 'live' | 'future';

interface TimelineEntry {
  colour: string;
  duration: number;
  isLast: boolean;
  lane: number;
  left: number;
  status: ProgressStatus;
  start: number;
  title: string;
  width: number;

  mayGrow: boolean;
  fullHeight: boolean;
}

const laneHeight = 120;
const formatOptions = {
  format12: 'hh:mm a',
  format24: 'HH:mm',
};

export function TimelineEntry(props: TimelineEntry) {
  const { colour, duration, isLast, lane, left, status, start, title, width, mayGrow, fullHeight } = props;

  const formattedStartTime = formatTime(start, formatOptions);
  const formattedDuration = formatDuration(duration);

  const lighterColour = alpha(colour, 0.7);
  const alphaColour = alpha(colour, 0.6);
  const columnClasses = cx([style.entryColumn, fullHeight && style.fullHeight]);
  const contentClasses = cx([style.entryContent, isLast && style.lastElement]);
  const textBgClasses = cx([style.entryText, mayGrow && style.textBg]);

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
          '--top': `${lane * laneHeight}px`,
        }}
      >
        <div
          className={textBgClasses}
          style={{
            '--bg': alphaColour ?? '',
          }}
        >
          <div className={style.start}>{formattedStartTime}</div>
          <div className={style.title}>{title}</div>
          <div className={style.duration}>{formattedDuration}</div>
          <TimelineEntryStatus status={status} start={start} />
        </div>
      </div>
    </div>
  );
}

interface TimelineEntryStatusProps {
  status: ProgressStatus;
  start: number;
}
// we isolate this component to avoid re-rendering too many elements
function TimelineEntryStatus(props: TimelineEntryStatusProps) {
  const { status, start } = props;
  // TODO: account for offset instead of just using the clock
  const { clock } = useClock();
  const statusText = getStatusLabel(start - clock, status);

  return <div className={style.status}>{statusText}</div>;
}
