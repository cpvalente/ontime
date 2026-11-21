import { MaybeNumber } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';
import { IoLockClosed, IoLockOpenOutline } from 'react-icons/io5';

import IconButton from '../../../../common/components/buttons/IconButton';
import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import TimeInputGroup from '../../time-input-flow/TimeInputGroup';

import style from '../EntryEditor.module.scss';

export type PhaseField = 'timeWarning' | 'timeDanger';

interface PhaseOverrideInputProps {
  field: PhaseField;
  label: string;
  /** the event value, null inherits */
  value: MaybeNumber;
  resolved: number;
  submitHandler: (field: PhaseField, value: MaybeNumber) => void;
}

export default function PhaseOverrideInput({ field, label, value, resolved, submitHandler }: PhaseOverrideInputProps) {
  const isOwn = value !== null;
  // the input shows whole seconds, so we compare and keep values at that precision
  const shown = parseUserTime(millisToString(resolved));

  const handleSubmit = (_field: PhaseField, newValue: string) => {
    const millis = parseUserTime(newValue);
    if (Number.isNaN(millis) || millis < 0) return;
    if (millis === shown) return;
    submitHandler(field, millis);
  };

  return (
    <div>
      <Editor.Label htmlFor={field}>{label}</Editor.Label>
      <TimeInputGroup>
        <TimeInput
          id={field}
          name={field}
          time={resolved}
          submitHandler={handleSubmit}
          className={isOwn ? undefined : style.inactive}
        />
        <Tooltip
          text={isOwn ? 'Unlock to inherit' : 'Lock for this event'}
          onClick={() => submitHandler(field, isOwn ? null : shown)}
          data-testid={`lock__${field}`}
          render={
            <IconButton
              variant='subtle-white'
              aria-label={`Lock ${label.toLowerCase()} for this event`}
              aria-pressed={isOwn}
              className={isOwn ? style.active : style.inactive}
            />
          }
        >
          {isOwn ? <IoLockClosed /> : <IoLockOpenOutline />}
        </Tooltip>
      </TimeInputGroup>
    </div>
  );
}
