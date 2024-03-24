import { memo, useCallback } from 'react';
import {
  Button,
  ButtonGroup,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  useDisclosure,
} from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoRemove } from '@react-icons/all-files/io5/IoRemove';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';
import { Playback } from 'ontime-types';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { useLocalStorage } from '../../../../common/hooks/useLocalStorage';
import { setPlayback } from '../../../../common/hooks/useSocket';
import { forgivingStringToMillis } from '../../../../common/utils/dateConfig';

interface AddTimeProps {
  playback: Playback;
  initialValue: number;
}

function AddTime(props: AddTimeProps) {
  const { playback, initialValue } = props;
  const { onOpen, onClose, isOpen } = useDisclosure();
  const [value, setValue] = useLocalStorage(`add-time-${initialValue}`, initialValue);

  const isRolling = playback === Playback.Roll;
  const isStopped = playback === Playback.Stop;
  const disableButtons = isStopped || isRolling;

  const handleChangeTime = useCallback(
    (_field: string, value: string) => {
      const millis = forgivingStringToMillis(value);
      setValue(millis);
    },
    [setValue],
  );

  const addTime = () => {
    setPlayback.addTime(value);
  };
  const decreaseTime = () => {
    setPlayback.addTime(-value);
  };

  const unit = 'm';

  return (
    <ButtonGroup isAttached>
      <IconButton
        onClick={decreaseTime}
        isDisabled={disableButtons}
        size='sm'
        aria-label='Decrease time'
        variant='ontime-subtle'
        color='white'
        icon={<IoRemove />}
      />
      <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} isLazy>
        <PopoverTrigger>
          <Button
            aria-label='Settings'
            rightIcon={<IoSettingsOutline />}
            size='sm'
            variant='ontime-ghosted'
            aspectRatio='auto'
            color='white'
          >
            {`${value}${unit}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverBody>
            <TimeInput name='add-time' submitHandler={handleChangeTime} placeholder={`${initialValue}min`} />
          </PopoverBody>
        </PopoverContent>
      </Popover>
      <IconButton
        onClick={addTime}
        isDisabled={disableButtons}
        size='sm'
        aria-label='Add time'
        variant='ontime-subtle'
        color='white'
        icon={<IoAdd />}
      />
    </ButtonGroup>
  );
}

export default memo(AddTime);
