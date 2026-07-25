import { TimeStrategy } from 'ontime-types';
import { memo } from 'react';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import { millisToDelayString } from '../../../../common/utils/dateConfig';
import { formatTime, normaliseWallClock } from '../../../../common/utils/time';
import TimeInputFlow from '../../time-input-flow/TimeInputFlow';

import style from '../EntryEditor.module.scss';

interface EventEditorScheduleProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: boolean;
  delay: number;
}

/**
 * Schedule of a single event
 * Schedule values cascade through the rundown, so they are not editable across a selection
 */
export default memo(EventEditorSchedule);
function EventEditorSchedule({
  eventId,
  timeStart,
  timeEnd,
  duration,
  timeStrategy,
  linkStart,
  delay,
}: EventEditorScheduleProps) {
  const hasDelay = delay !== 0;
  const delayedStart = normaliseWallClock(timeStart + delay);
  const delayedEnd = normaliseWallClock(timeEnd + delay);
  const delayLabel = hasDelay
    ? `Event is ${millisToDelayString(delay, 'expanded')}. New schedule ${formatTime(delayedStart)} → ${formatTime(delayedEnd)}`
    : '';

  return (
    <div className={style.column}>
      <Editor.Title>Event schedule</Editor.Title>
      <div>
        <div className={style.inline}>
          <TimeInputFlow
            eventId={eventId}
            timeStart={timeStart}
            timeEnd={timeEnd}
            duration={duration}
            timeStrategy={timeStrategy}
            linkStart={linkStart}
            delay={delay}
            showLabels
          />
        </div>
        <div className={style.delayLabel}>{delayLabel}</div>
      </div>
    </div>
  );
}
