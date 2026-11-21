import { MaybeNumber } from 'ontime-types';
import { millisToString, parsePhaseTimeInput, parseUserTime } from 'ontime-utils';
import { useState } from 'react';
import { IoArrowUndo } from 'react-icons/io5';

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
  value: MaybeNumber;
  resolved: number;
  submitHandler: (field: PhaseField, value: MaybeNumber) => void;
}

export default function PhaseOverrideInput({ field, label, value, resolved, submitHandler }: PhaseOverrideInputProps) {
  const isOwn = value !== null;
  // the input shows whole seconds, so we compare and keep values at that precision
  const shown = parseUserTime(millisToString(resolved));

  // remounting brings back the shown value after text which is not a time
  const [rejected, setRejected] = useState(0);

  const handleSubmit = (_field: PhaseField, newValue: string) => {
    const millis = parsePhaseTimeInput(newValue);
    if (millis === null) {
      setRejected((count) => count + 1);
      return;
    }
    if (millis === shown) return;
    submitHandler(field, millis);
  };

  return (
    <div>
      <Editor.Label htmlFor={field}>{label}</Editor.Label>
      <TimeInputGroup>
        <TimeInput
          key={rejected}
          id={field}
          name={field}
          time={resolved}
          submitHandler={handleSubmit}
          className={isOwn ? undefined : style.inactive}
        />
        <Tooltip
          text='Use the inherited value'
          render={
            <IconButton
              variant='subtle-white'
              aria-label={`Use the inherited ${label.toLowerCase()}`}
              disabled={!isOwn}
              onClick={() => submitHandler(field, null)}
              data-testid={`inherit__${field}`}
            />
          }
        >
          <IoArrowUndo />
        </Tooltip>
      </TimeInputGroup>
    </div>
  );
}
