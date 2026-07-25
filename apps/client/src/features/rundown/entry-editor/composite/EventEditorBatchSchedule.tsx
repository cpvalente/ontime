import { OntimeEvent } from 'ontime-types';
import { MILLIS_PER_SECOND, dayInMs, parseUserTime } from 'ontime-utils';
import { memo } from 'react';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { mixedPlaceholder } from '../entryEditor.utils';

import style from '../EntryEditor.module.scss';

interface EventEditorBatchScheduleProps {
  /** undefined when the events do not share a duration */
  duration: number | undefined;
  submit: (patch: Partial<OntimeEvent>) => void;
}

/**
 * Schedule fields which can be applied to several events at once
 * Start and end times are absolute points in time: giving several events the same
 * value would collapse their durations, so only the duration is offered here
 * The server infers the duration lock and recalculates the rundown once for the whole batch
 */
export default memo(EventEditorBatchSchedule);
function EventEditorBatchSchedule({ duration, submit }: EventEditorBatchScheduleProps) {
  const handleSubmit = (_field: 'duration', value: string) => {
    // durations cannot exceed a day
    submit({ duration: Math.min(parseUserTime(value), dayInMs - MILLIS_PER_SECOND) });
  };

  return (
    <div className={style.column}>
      <Editor.Title>Event schedule</Editor.Title>
      <div className={style.splitTwo}>
        <div>
          <Editor.Label htmlFor='duration'>Duration</Editor.Label>
          <TimeInput
            id='duration'
            name='duration'
            submitHandler={handleSubmit}
            time={duration}
            placeholder={duration === undefined ? mixedPlaceholder : 'Duration'}
            align='left'
          />
        </div>
      </div>
    </div>
  );
}
