import { useCallback, useEffect, useState } from 'react';
import { Tooltip } from '@chakra-ui/react';
import { Playback } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import TimerDisplay from '../../../../common/components/timer-display/TimerDisplay';
import { setPlayback, useTimer } from '../../../../common/hooks/useSocket';
import { useEditorSettings } from '../../../../common/stores/editorSettings';
import { millisToMinutes, millisToSeconds } from '../../../../common/utils/dateConfig';
import { tooltipDelayMid } from '../../../../ontimeConfig';
import TapButton from '../tap-button/TapButton';

import style from './PlaybackTimer.module.scss';

interface PlaybackTimerProps {
  playback: Playback;
}

export default function PlaybackTimer(props: PlaybackTimerProps) {
  const { playback } = props;
  const timer = useTimer();
  const { addTimeAmounts } = useEditorSettings((state) => state.eventSettings);

  // TODO: checkout typescript in utilities
  const started = millisToString(timer.startedAt);
  const finish = millisToString(timer.expectedFinish);
  const isRolling = playback === Playback.Roll;
  const isStopped = playback === Playback.Stop;
  const isWaiting = timer.secondaryTimer !== null && timer.secondaryTimer > 0 && timer.current === null;
  const disableButtons = isStopped || isRolling;
  const isOvertime = timer.current !== null && timer.current < 0;
  const hasAddedTime = Boolean(timer.addedTime);
  const [shiftState, setShiftState] = useState(false);

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

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // handle held key
      if (event.repeat) return;
      // Check if the shift key is pressed
      setShiftState(!event.altKey && !event.ctrlKey && event.shiftKey);
    },
    [setShiftState],
  );

  // listen to keys
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('keyup', handleKeyPress);
    };
  }, [handleKeyPress]);

  const addedTimeLabel = resolveAddedTimeLabel();
  const addTimeButtonLable = (value: number) => {
    const isPositive = value >= 0;
    const roundToMin = value % 60 == 0;
    const nearestMinOrSec = roundToMin ? value / 60 : value;
    return `${isPositive ? '+' : ''}${nearestMinOrSec}${roundToMin ? 'm' : 's'}`;
  };

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
      <div className={style.timer}>
        <TimerDisplay time={isWaiting ? timer.secondaryTimer : timer.current} />
      </div>
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
        <Tooltip label='Remove 1 minute' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <TapButton
            onClick={() => setPlayback.addTime(shiftState ? addTimeAmounts.aShift : addTimeAmounts.a)}
            disabled={disableButtons}
            aspect='square'
          >
            {shiftState ? addTimeButtonLable(addTimeAmounts.aShift) : addTimeButtonLable(addTimeAmounts.a)}
          </TapButton>
        </Tooltip>
        <Tooltip label='Add 1 minute' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <TapButton
            onClick={() => setPlayback.addTime(shiftState ? addTimeAmounts.bShift : addTimeAmounts.b)}
            disabled={disableButtons}
            aspect='square'
          >
            {shiftState ? addTimeButtonLable(addTimeAmounts.bShift) : addTimeButtonLable(addTimeAmounts.b)}
          </TapButton>
        </Tooltip>
        <Tooltip label='Remove 5 minutes' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <TapButton
            onClick={() => setPlayback.addTime(shiftState ? addTimeAmounts.cShift : addTimeAmounts.c)}
            disabled={disableButtons}
            aspect='square'
          >
            {shiftState ? addTimeButtonLable(addTimeAmounts.cShift) : addTimeButtonLable(addTimeAmounts.c)}
          </TapButton>
        </Tooltip>
        <Tooltip label='Add 5 minutes' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <TapButton
            onClick={() => setPlayback.addTime(shiftState ? addTimeAmounts.dShift : addTimeAmounts.d)}
            disabled={disableButtons}
            aspect='square'
          >
            {shiftState ? addTimeButtonLable(addTimeAmounts.dShift) : addTimeButtonLable(addTimeAmounts.d)}
          </TapButton>
        </Tooltip>
      </div>
    </div>
  );
}
