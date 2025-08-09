import { IoLockClosed, IoLockOpenOutline } from 'react-icons/io5';
import { MaybeNumber } from 'ontime-types';

import IconButton from '../../../../common/components/buttons/IconButton';
import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import NullableTimeInput from '../../../../common/components/input/time-input/NullableTimeInput';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import { cx, enDash } from '../../../../common/utils/styleUtils';
import TimeInputGroup from '../../time-input-flow/TimeInputGroup';

import style from '../EntryEditor.module.scss';

interface TargetDurationInputProps {
  duration: MaybeNumber;
  targetDuration: MaybeNumber;
  submitHandler: (field: 'targetDuration', value: MaybeNumber) => void;
}

export default function TargetDurationInput({ duration, targetDuration, submitHandler }: TargetDurationInputProps) {
  const isLocked = targetDuration !== null;

  return (
    <div>
      <Editor.Label htmlFor='targetDuration'>Target duration</Editor.Label>
      <TimeInputGroup hasDelay={isLocked && targetDuration !== duration}>
        <NullableTimeInput
          name='targetDuration'
          time={targetDuration}
          submitHandler={submitHandler}
          emptyDisplay={enDash}
          className={isLocked ? '' : style.inactive}
        />
        <Tooltip
          text='Lock to target duration'
          className={cx([style.timeAction, isLocked && style.active])}
          onClick={() => submitHandler('targetDuration', isLocked ? null : duration)}
          data-testid='lock__duration'
          render={<IconButton variant='subtle-white' className={isLocked ? style.active : style.inactive} />}
        >
          {isLocked ? <IoLockClosed /> : <IoLockOpenOutline />}
        </Tooltip>
      </TimeInputGroup>
    </div>
  );
}
