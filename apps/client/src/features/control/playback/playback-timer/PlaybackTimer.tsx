import { Button, ButtonGroup, IconButton, Tooltip } from '@chakra-ui/react';
import { Playback } from 'ontime-types';
import { millisToMinutes, millisToSeconds, millisToString } from 'ontime-utils';

import { setPlayback, useTimer } from '../../../../common/hooks/useSocket';
import { tooltipDelayMid } from '../../../../ontimeConfig';
import TapButton from '../tap-button/TapButton';
import TimerDisplay from '../timer-display/TimerDisplay';

import style from './PlaybackTimer.module.scss';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoRemove } from '@react-icons/all-files/io5/IoRemove';
import { useState } from 'react';
import { set } from 'react-hook-form';
import { IoPencil } from '@react-icons/all-files/io5/IoPencil';
import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';

interface PlaybackTimerProps {
  playback: Playback;
}

export default function PlaybackTimer(props: PlaybackTimerProps) {
  const { playback } = props;
  const timer = useTimer();

  // TODO: checkout typescript in utilities
  const started = millisToString(timer.startedAt);
  const finish = millisToString(timer.expectedFinish);
  const isRolling = playback === Playback.Roll;
  const isStopped = playback === Playback.Stop;
  const isWaiting = timer.secondaryTimer !== null && timer.secondaryTimer > 0 && timer.current === null;
  const disableButtons = isStopped || isRolling;
  const isOvertime = timer.current !== null && timer.current < 0;
  const hasAddedTime = Boolean(timer.addedTime);

  const rollLabel = isRolling ? 'Roll mode active' : '';

  const resolveAddedTimeLabel = () => {
    function resolveClosestUnit(ms: number) {
      if (ms < 6000) {
        return `${millisToSeconds(ms)} seconds`;
      } else if (ms < 12000) {
        return '1 minute';
      } else {
        return `${millisToMinutes(ms)} minutes`;
      }
    }

    if (timer.addedTime > 0) {
      return `Added ${resolveClosestUnit(timer.addedTime)}`;
    }

    if (timer.addedTime < 0) {
      return `Removed ${resolveClosestUnit(timer.addedTime)}`;
    }

    return '';
  };

  const addedTimeLabel = resolveAddedTimeLabel();

  return (
    <div className={style.timeContainer}>
      <div className={style.indicators}>
        <Tooltip label={rollLabel}>
          <div className={isRolling ? style.indRollActive : style.indRoll} />
        </Tooltip>
        <div className={isOvertime ? style.indNegativeActive : style.indNegative} />
        <Tooltip label={addedTimeLabel}>
          <div className={hasAddedTime ? style.indDelayActive : style.indDelay} />
        </Tooltip>
      </div>
      <TimerDisplay time={isWaiting ? timer.secondaryTimer : timer.current} />
      {isWaiting ? (
        <div className={style.roll}>
          <span className={style.rolltag}>Roll: Countdown to start</span>
        </div>
      ) : (
        <>
          <div className={style.start}>
            <span className={style.tag}>Started at </span>
            <span className={style.time}>{started}</span>
          </div>
          <div className={style.finish}>
            <span className={style.tag}>Finish at </span>
            <span className={style.time}>{finish}</span>
          </div>
        </>
      )}
      <div className={style.btn}>
        <TimeControlButtonGroup />
        <TimeControlButtonGroup />
        {/* <Tooltip label='Remove 1 minute' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <TapButton onClick={() => setPlayback.addTime(-60)} disabled={disableButtons} aspect='square'>
            -1
          </TapButton>
        </Tooltip>
        <Tooltip label='Add 1 minute' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <TapButton onClick={() => setPlayback.addTime(60)} disabled={disableButtons} aspect='square'>
            +1
          </TapButton>
        </Tooltip>
        <Tooltip label='Remove 5 minutes' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <TapButton onClick={() => setPlayback.addTime(-5 * 60)} disabled={disableButtons} aspect='square'>
            -5
          </TapButton>
        </Tooltip>
        <Tooltip label='Add 5 minutes' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <TapButton onClick={() => setPlayback.addTime(+5 * 60)} disabled={disableButtons} aspect='square'>
            +5
          </TapButton>
        </Tooltip> */}
      </div>
    </div>
  );
}

function TimeControlButtonGroup() {
  const [value, setValue] = useState(1);
  const [unit, setUnit] = useState<'sec' | 'min'>('sec');
  const [edit, setEdit] = useState(false);

  const toggleUnit = () => {
    setUnit(unit === 'sec' ? 'min' : 'sec');
  };

  const increment = () => {
    setValue(Math.min(value + 1, 59));
  };

  const decrement = () => {
    setValue(Math.max(1, value - 1));
  };

  const openEdit = () => setEdit(true);

  const closeEdit = () => setEdit(false)

  return (
    <ButtonGroup size='sm' isAttached variant='ontime-subtle' className={style.buttonGroup}>
      {edit ? (
        <>
          <IconButton aria-label='Subtract time' color='white' icon={<IoRemove />} onClick={decrement} />
          <TapButton onClick={() => undefined}>{value}</TapButton>
          <TapButton onClick={() => undefined}>{unit}</TapButton>
          <IconButton aria-label='Add time' color='white' icon={<IoAdd />} onClick={increment} />
          <IconButton aria-label='Edit' icon={<IoCheckmark />} onClick={closeEdit} />
        </>
      ) : (
        <>
          <TapButton onClick={() => undefined}>{`-${value}`}</TapButton>
          <TapButton onClick={() => undefined}>{`+${value}`}</TapButton>
          <Button color='white' variant='ontime-ghosted' rightIcon={<IoPencil />} onClick={openEdit}>
            {unit}
          </Button>
        </>
      )}
    </ButtonGroup>
  );
}
