import { useHotkeys, useLocalStorage } from '@mantine/hooks';
import { Playback, SimpleDirection, SimplePlayback, TimerPhase } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';
import { IoAdd, IoArrowDown, IoArrowUp, IoPause, IoPlay, IoPlaySkipForward, IoRemove, IoStop } from 'react-icons/io5';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import {
  setAuxTimer,
  setPlayback,
  useAuxTimerControl,
  useAuxTimerTime,
  usePlaybackControl,
  useTimer,
} from '../../../../common/hooks/useSocket';
import { enDash } from '../../../../common/utils/styleUtils';
import { formatDuration } from '../../../../common/utils/time';
import { getPlaybackControlState } from '../playbackControl.utils';
import TapButton from '../tap-button/TapButton';
import TimerDisplay from '../timer-display/TimerDisplay';

import style from './TrackingPlaybackBar.module.scss';

export default function TrackingPlaybackBar() {
  const timer = useTimer();

  const { playback, numEvents, selectedEventIndex } = usePlaybackControl();

  const { playback: auxPlayback, direction: auxDirection } = useAuxTimerControl(1);
  const auxTime = useAuxTimerTime(1);

  const [addTimeInMs] = useLocalStorage({ key: 'add-time', defaultValue: 300_000 });

  const { disableGo, disableNext, disableAddTime, isPlaying, goAction, goLabel } = getPlaybackControlState({
    playback,
    numEvents,
    selectedEventIndex,
    timerPhase: timer.phase,
  });

  const disableAddTimeWithAmount = disableAddTime || addTimeInMs === 0;

  const handleAddTime = (direction: 'add' | 'remove') => {
    if (disableAddTimeWithAmount) return;
    if (direction === 'add') {
      setPlayback.addTime(addTimeInMs);
    } else {
      setPlayback.addTime(-1 * addTimeInMs);
    }
  };

  const handleAuxPlayPause = () => {
    if (auxPlayback === SimplePlayback.Start) {
      setAuxTimer.pause(1);
    } else {
      setAuxTimer.start(1);
    }
  };

  const handleAuxStop = () => {
    setAuxTimer.stop(1);
  };

  const handleAuxDirectionToggle = () => {
    const newDirection =
      auxDirection === SimpleDirection.CountDown ? SimpleDirection.CountUp : SimpleDirection.CountDown;
    setAuxTimer.setDirection(1, newDirection);
  };

  const handleAuxTimeChange = (_field: string, value: string) => {
    const newTimeInMs = parseUserTime(value);
    setAuxTimer.setDuration(1, newTimeInMs);
  };

  useHotkeys([
    ['Space', () => !disableGo && goAction(), { preventDefault: true }],
    ['N', () => !disableNext && setPlayback.next(), { preventDefault: true }],
    ['Escape', () => playback !== Playback.Stop && setPlayback.stop(), { preventDefault: true }],
  ]);

  const isWaiting = timer.phase === TimerPhase.Pending;
  const isOvertime = timer.phase === TimerPhase.Overtime;
  const displayTime = isWaiting ? timer.secondaryTimer : timer.current;

  const addTimeLabel = formatDuration(addTimeInMs);

  return (
    <div className={style.container}>
      <div className={style.itemGroup}>
        <TapButton
          onClick={goAction}
          disabled={disableGo}
          theme={Playback.Play}
          active={isPlaying}
          className={style.goButton}
        >
          <span className={style.goLabel}>{goLabel}</span>
          <span className={style.shortcutHint}>[space]</span>
        </TapButton>

        <TapButton
          onClick={setPlayback.next}
          disabled={disableNext}
          className={style.iconButtonWithLabel}
          aspect='square'
        >
          <IoPlaySkipForward />
          <span className={style.shortcutHint}>[n]</span>
        </TapButton>

        <TapButton
          onClick={setPlayback.stop}
          disabled={playback === Playback.Stop}
          className={style.iconButtonWithLabel}
          aspect='square'
        >
          <IoStop />
          <span className={style.shortcutHint}>[esc]</span>
        </TapButton>

        <div className={style.addSection}>
          <div className={style.separator} />
          <TapButton
            onClick={() => handleAddTime('remove')}
            disabled={disableAddTimeWithAmount}
            className={style.iconButtonWithLabel}
            aspect='square'
          >
            <IoRemove />
            {addTimeLabel}
          </TapButton>
          <TapButton
            onClick={() => handleAddTime('add')}
            disabled={disableAddTimeWithAmount}
            className={style.iconButtonWithLabel}
            aspect='square'
          >
            <IoAdd />
            {addTimeLabel}
          </TapButton>
        </div>
      </div>

      <div className={style.timerSection}>
        <span className={style.negativeIndicator} data-active={isOvertime}>
          {enDash}
        </span>
        <TimerDisplay time={displayTime} phase={timer.phase} />
      </div>

      <div className={style.auxSection}>
        <TapButton onClick={handleAuxPlayPause} className={style.iconButton} theme={Playback.Play} aspect='square'>
          {auxPlayback === SimplePlayback.Start ? <IoPause /> : <IoPlay />}
        </TapButton>
        <TapButton
          onClick={handleAuxStop}
          disabled={auxPlayback === SimplePlayback.Stop}
          className={style.iconButton}
          theme={Playback.Stop}
          aspect='square'
        >
          <IoStop />
        </TapButton>
        {auxPlayback !== SimplePlayback.Stop ? (
          <div className={style.auxTimeDisplay}>{millisToString(auxTime)}</div>
        ) : (
          <TimeInput
            name='aux1-tracking'
            submitHandler={handleAuxTimeChange}
            time={auxTime}
            className={style.auxTimeInput}
          />
        )}
        <TapButton
          onClick={handleAuxDirectionToggle}
          disabled={auxPlayback !== SimplePlayback.Stop}
          className={style.iconButton}
          aspect='square'
        >
          {auxDirection === SimpleDirection.CountDown ? <IoArrowDown /> : <IoArrowUp />}
        </TapButton>
      </div>
    </div>
  );
}
