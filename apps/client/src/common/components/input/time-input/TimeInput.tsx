import { useRef } from 'react';
import { Button, Input, InputGroup, InputLeftElement, Tooltip } from '@chakra-ui/react';

import { EventEditorSubmitActions } from '../../../../features/event-editor/EventEditor';
import { tooltipDelayFast } from '../../../../ontimeConfig';
import { TimeEntryField } from '../../../utils/timesManager';

import useTimeInput from './timeInputUtils';

import style from './TimeInput.module.scss';

interface TimeInputProps {
  name: TimeEntryField;
  submitHandler: (field: EventEditorSubmitActions, value: number) => void;
  time?: number;
  delay?: number;
  placeholder: string;
  validationHandler: (entry: TimeEntryField, val: number) => boolean;
  previousEnd?: number;
  value?: string;
}

export default function TimeInput(props: TimeInputProps) {
  const {
    name,
    submitHandler,
    time = 0,
    delay = 0,
    placeholder,
    validationHandler,
    previousEnd = 0,
    value = '',
  } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const timeInputProps = useTimeInput(
    value,
    inputRef,
    time,
    delay,
    previousEnd,
    name,
    submitHandler,
    validationHandler,
  );

  const isDelayed = delay != null && delay !== 0;

  const ButtonInitial = () => {
    if (name === 'timeStart') return 'S';
    if (name === 'timeEnd') return 'E';
    if (name === 'durationOverride') return 'D';
    return '';
  };

  const ButtonTooltip = () => {
    if (name === 'timeStart') return 'Start';
    if (name === 'timeEnd') return 'End';
    if (name === 'durationOverride') return 'Duration';
    return '';
  };

  return (
    <InputGroup size='sm' className={`${style.timeInput} ${isDelayed ? style.delayed : ''}`}>
      <InputLeftElement width='fit-content'>
        <Tooltip label={ButtonTooltip()} openDelay={tooltipDelayFast} variant='ontime-ondark'>
          <Button
            size='sm'
            variant='ontime-subtle-white'
            className={`${style.inputButton} ${isDelayed ? style.delayed : ''}`}
            tabIndex={-1}
            border={isDelayed ? '1px solid #E69056' : '1px solid transparent'}
            borderRight='1px solid transparent'
            borderRadius='2px 0 0 2px'
          >
            {ButtonInitial()}
          </Button>
        </Tooltip>
      </InputLeftElement>
      <Input
        ref={inputRef}
        data-testid='time-input'
        className={style.inputField}
        type='text'
        placeholder={placeholder}
        variant='ontime-filled'
        {...timeInputProps}
        maxLength={8}
      />
    </InputGroup>
  );
}
