import { Button } from '@chakra-ui/react';
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

  // TODO: check that it does AM-PM
  const started = millisToString(startedAt);
  // TODO: finish at should account for speed factor
  const finishAt = millisToString(expectedFinish !== null ? expectedFinish % dayInMs : null);

  // TODO: this would cause re-renders on every second, we want to isolate this
  const newFinish = millisToString(useExpectedTime(current ?? 0, newSpeed));

  return (
    <>
      <table>
        <tr>
          <td className={style.label}>Started at </td>
          <td>{started}</td>
        </tr>
        <tr>
          <td className={style.label}>Normal Expected end </td>
          <td>{finishAt}</td>
        </tr>
        <tr>
          <td className={style.label}>Estimated Speedup end </td>
          <td>{newFinish}</td>
        </tr>
      </table>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
        <div>
          <span>{`${speed}x`}</span>
          {newSpeed !== speed && <span className={style.highlight}>{` ⇢ ${newSpeed}x`}</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
function useExpectedTime(remainingTimeMs: number, speedFactor: number): number {
  const { clock } = useClock();
  const adjustedRemainingTimeMs = remainingTimeMs / speedFactor;
  const newFinishTimeMs = clock + adjustedRemainingTimeMs;
  return newFinishTimeMs;
}
