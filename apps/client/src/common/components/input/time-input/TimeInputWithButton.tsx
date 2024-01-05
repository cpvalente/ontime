import { useMemo } from 'react';
import { Button, InputGroup, InputLeftElement, Tooltip } from '@chakra-ui/react';

import { tooltipDelayFast } from '../../../../ontimeConfig';
import { cx } from '../../../utils/styleUtils';
import { TimeEntryField } from '../../../utils/timesManager';

import TimeInput from './TimeInput';

import style from './TimeInputWithButton.module.scss';

interface TimeInputProps {
  id?: TimeEntryField;
  name: TimeEntryField;
  submitHandler: (field: TimeEntryField, value: number) => void;
  time?: number;
  delay?: number;
  placeholder: string;
  previousEnd?: number;
  warning?: string;
}

function ButtonInitial(name: TimeEntryField) {
  if (name === 'timeStart') return 'S';
  if (name === 'timeEnd') return 'E';
  if (name === 'durationOverride') return 'D';
  if (name === 'timeWarning') return 'Wa';
  if (name === 'timeDanger') return 'Da';
  return '';
}

function ButtonTooltip(name: TimeEntryField, warning?: string) {
  if (name === 'timeStart') return `Start${warning ? `: ${warning}` : ''}`;
  if (name === 'timeEnd') return `End${warning ? `: ${warning}` : ''}`;
  if (name === 'durationOverride') return `Duration${warning ? `: ${warning}` : ''}`;
  if (name === 'timeWarning') return `Warning${warning ? `: ${warning}` : ''}`;
  if (name === 'timeDanger') return `Danger${warning ? `: ${warning}` : ''}`;
  return '';
}

export default function TimeInputWithButton(props: TimeInputProps) {
  const { id, name, submitHandler, time = 0, delay = 0, placeholder, previousEnd = 0, warning } = props;

  const isDelayed = delay !== 0;
  const inputClasses = cx([style.timeInput, isDelayed ? style.delayed : null]);
  const buttonClasses = cx([style.inputButton, isDelayed ? style.delayed : null, warning ? style.warn : null]);

  const TooltipLabel = useMemo(() => {
    return ButtonTooltip(name, warning);
  }, [name, warning]);

  const ButtonText = useMemo(() => {
    return ButtonInitial(name);
  }, [name]);

  return (
    <InputGroup size='sm' className={inputClasses}>
      <InputLeftElement className={style.inputLeft}>
        <Tooltip label={TooltipLabel} openDelay={tooltipDelayFast} variant='ontime-ondark'>
          <Button
            size='sm'
            variant='ontime-subtle-white'
            className={buttonClasses}
            tabIndex={-1}
            border={isDelayed ? '1px solid #E69056' : '1px solid transparent'}
            borderRight='1px solid transparent'
            borderRadius='2px 0 0 2px'
          >
            {ButtonText}
          </Button>
        </Tooltip>
      </InputLeftElement>
      <TimeInput
        id={id}
        name={name}
        submitHandler={submitHandler}
        time={time}
        delay={delay}
        placeholder={placeholder}
        previousEnd={previousEnd}
        className={style.inputField}
      />
    </InputGroup>
  );
}
