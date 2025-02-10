import { Button } from '@chakra-ui/react';
import { MaybeNumber } from 'ontime-types';
import { dayInMs, millisToString } from 'ontime-utils';

import { setTimerSpeed, useClock, useTimer } from '../../../../common/hooks/useSocket';

import style from './TimerSpeed.module.scss';

type SpeedOverridePhase = 'idle' | 'calculating' | 'applied';

interface MeetScheduleProps {
  speed: number;
  newSpeed: number;
  setNewSpeed: (value: number) => void;
}

export default function MeetSchedule(props: MeetScheduleProps) {
  const { speed, newSpeed, setNewSpeed } = props;
  const { setSpeed } = setTimerSpeed;
  const { startedAt, expectedFinish, current } = useTimer();

  const handleApply = () => {
    setSpeed(newSpeed);
  };

  const handleCancel = () => {
    setNewSpeed(speed);
  };

  const handleReset = () => {
    setNewSpeed(1);
  };

  const phase: SpeedOverridePhase = (() => {
    if (newSpeed === speed) {
      if (speed !== 1) {
        return 'applied';
      }
      return 'idle';
    }
    return 'calculating';
  })();

  //TODO: can these functions be memoised
  const started = millisToString(startedAt);
  // TODO: Should this stay as the default expected end or change to the expected end of the speed up after it is applied

  const currentExpectedFinish = millisToString(expectedFinish !== null ? expectedFinish % dayInMs : null);
  const newExpectedFinish = millisToString(useExpectedTime(expectedFinish !== null ? current : null, newSpeed));

  return (
    <>
      <table>
        <tr>
          <td className={style.label}>Started at </td>
          <td>{started}</td>
        </tr>
        <tr>
          <td className={style.label}>Expected end </td>
          <td>
            <span>{currentExpectedFinish}</span>
            {phase === 'calculating' ? <span className={style.highlight}>{` ⇢ ${newExpectedFinish}`}</span> : null}
          </td>
        </tr>
      </table>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
        <div>
          <span>{`${speed}x`}</span>
          {newSpeed !== speed && <span className={style.highlight}>{` ⇢ ${newSpeed}x`}</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size='sm' variant='ontime-subtle-white' isDisabled={phase !== 'calculating'} onClick={handleCancel}>
            Cancel
          </Button>
          {phase !== 'applied' ? (
            <Button size='sm' variant='ontime-subtle-white' onClick={handleApply} isDisabled={phase !== 'calculating'}>
              Apply
            </Button>
          ) : (
            <Button size='sm' variant='ontime-subtle-white' onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

// TODO: extract and test
// calculate the new finish time
function useExpectedTime(remainingTimeMs: MaybeNumber, speedFactor: number): MaybeNumber {
  const { clock } = useClock();
  if (remainingTimeMs === null) {
    return null;
  }
  const adjustedRemainingTimeMs = remainingTimeMs / speedFactor;
  const newFinishTimeMs = clock + adjustedRemainingTimeMs;
  return newFinishTimeMs;
}
