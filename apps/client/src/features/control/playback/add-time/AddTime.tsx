import { Tooltip } from '@chakra-ui/react';
import { useLocalStorage } from '@mantine/hooks';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoRemove } from '@react-icons/all-files/io5/IoRemove';
import { Playback } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_SECOND } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { setPlayback } from '../../../../common/hooks/useSocket';
import { forgivingStringToMillis } from '../../../../common/utils/dateConfig';
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
    const newTime = forgivingStringToMillis(value);
    // cap add time to 1 hour
    setTime(Math.min(newTime, MILLIS_PER_HOUR));
  };

  const handleAddTime = (direction: 'add' | 'remove') => {
    // API expects input in seconds
    if (direction === 'add') {
      setPlayback.addTime(time / MILLIS_PER_SECOND);
    } else {
      setPlayback.addTime((-1 * time) / MILLIS_PER_SECOND);
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
