import { useLocalStorage } from '@mantine/hooks';
import { Playback } from 'ontime-types';
import { MILLIS_PER_HOUR, parseUserTime } from 'ontime-utils';
import { IoAdd, IoRemove } from 'react-icons/io5';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { clearOffsetReset, resetOffset, setPlayback, useOffsetOverview } from '../../../../common/hooks/useSocket';
import TapButton from '../tap-button/TapButton';

import style from './AddTime.module.scss';

interface AddTimeProps {
  playback: Playback;
}

export default function AddTime(props: AddTimeProps) {
  const { playback } = props;
  const [timeInMs, setTime] = useLocalStorage({ key: 'add-time', defaultValue: 300_000 }); // 5 minutes

  const handleTimeChange = (_field: string, value: string) => {
    const newTimeInMs = parseUserTime(value);
    // cap add time to 1 hour
    setTime(Math.min(newTimeInMs, MILLIS_PER_HOUR));
  };

  const handleAddTime = (direction: 'add' | 'remove') => {
    // API expects input in milliseconds
    if (direction === 'add') {
      setPlayback.addTime(timeInMs);
    } else {
      setPlayback.addTime(-1 * timeInMs);
    }
  };

  const canAddTime = playback === Playback.Play || playback === Playback.Pause;
  const doDisableButtons = !canAddTime || timeInMs === 0;

  return (
    <div className={style.addTime}>
      <TimeInput
        name='addtime'
        submitHandler={handleTimeChange}
        time={timeInMs}
        placeholder='Add time'
        className={style.amount}
      />
      <div className={style.addButtons}>
        <TapButton onClick={() => handleAddTime('remove')} disabled={doDisableButtons} className={style.tallButtons}>
          <IoRemove />
        </TapButton>
        <TapButton onClick={() => handleAddTime('add')} disabled={doDisableButtons} className={style.tallButtons}>
          <IoAdd />
        </TapButton>
      </div>
      <ResetOffset canReset={canAddTime} />
    </div>
  );
}

/** A reset measures the offset from now, Plan measures it from the plan again */
function ResetOffset({ canReset }: { canReset: boolean }) {
  const { offset, isReset } = useOffsetOverview();

  return (
    <div className={style.resetRow}>
      <TapButton onClick={resetOffset} disabled={!canReset || offset === 0} className={style.reset}>
        {isReset ? 'Reset' : 'Reset offset'}
      </TapButton>
      {isReset && (
        <TapButton onClick={clearOffsetReset} className={style.reset}>
          Plan
        </TapButton>
      )}
    </div>
  );
}
