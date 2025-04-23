import { IoAdd, IoRemove } from 'react-icons/io5';
import { Tooltip } from '@chakra-ui/react';
import { useLocalStorage } from '@mantine/hooks';
import { Playback } from 'ontime-types';
import { MILLIS_PER_HOUR, parseUserTime } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { setPlayback } from '../../../../common/hooks/useSocket';
import { tooltipDelayMid } from '../../../../ontimeConfig';
import TapButton from '../tap-button/TapButton';

import style from './AddTime.module.scss';

interface AddTimeProps {
  playback: Playback;
}

export default function AddTime(props: AddTimeProps) {
  const { playback } = props;
  const [time, setTime] = useLocalStorage({ key: 'add-time', defaultValue: 300_000 }); // 5 minutes

  const handleTimeChange = (_field: string, value: string) => {
    const newTime = parseUserTime(value);
    // cap add time to 1 hour
    setTime(Math.min(newTime, MILLIS_PER_HOUR));
  };

  const handleAddTime = (direction: 'add' | 'remove') => {
    // API expects input in milliseconds
    if (direction === 'add') {
      setPlayback.addTime(time);
    } else {
      setPlayback.addTime(-1 * time);
    }
  };

  const canAddTime = playback === Playback.Play || playback === Playback.Pause;
  const doDisableButtons = !canAddTime || time === 0;

  return (
    <div className={style.addTime}>
      <TimeInput name='addtime' submitHandler={handleTimeChange} time={time} placeholder='Add time' />
      <div className={style.addButtons}>
        <Tooltip label='Remove time' openDelay={tooltipDelayMid} shouldWrapChildren>
          <TapButton onClick={() => handleAddTime('remove')} disabled={doDisableButtons} className={style.tallButtons}>
            <IoRemove />
          </TapButton>
        </Tooltip>
        <Tooltip label='Add time' openDelay={tooltipDelayMid} shouldWrapChildren>
          <TapButton onClick={() => handleAddTime('add')} disabled={doDisableButtons} className={style.tallButtons}>
            <IoAdd />
          </TapButton>
        </Tooltip>
      </div>
    </div>
  );
}
