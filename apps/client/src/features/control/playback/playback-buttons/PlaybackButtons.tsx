import { useMemo } from 'react';
import { Tooltip } from '@chakra-ui/react';
import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoPlaySkipBack } from '@react-icons/all-files/io5/IoPlaySkipBack';
import { IoPlaySkipForward } from '@react-icons/all-files/io5/IoPlaySkipForward';
import { IoReload } from '@react-icons/all-files/io5/IoReload';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import { IoTime } from '@react-icons/all-files/io5/IoTime';
import { Playback, TimerPhase } from 'ontime-types';
import { validatePlayback } from 'ontime-utils';

import { setPlayback } from '../../../../common/hooks/useSocket';
import { tooltipDelayMid } from '../../../../ontimeConfig';
import TapButton from '../tap-button/TapButton';

import style from './PlaybackButtons.module.scss';

interface PlaybackButtonsProps {
  playback: Playback;
  numEvents: number;
  selectedEventIndex: number | null;
  timerPhase: TimerPhase;
}

export default function PlaybackButtons(props: PlaybackButtonsProps) {
  const { playback, numEvents, selectedEventIndex, timerPhase } = props;

  const isRolling = playback === Playback.Roll;
  const isPlaying = playback === Playback.Play;
  const isPaused = playback === Playback.Pause;
  const isArmed = playback === Playback.Armed;

  const isFirst = selectedEventIndex === 0;
  const isLast = selectedEventIndex === numEvents - 1;
  const noEvents = numEvents === 0;

  const disableGo = isRolling || noEvents;
  const disableNext = isRolling || noEvents || isLast;
  const disablePrev = isRolling || noEvents || isFirst;

  const playbackCan = validatePlayback(playback, timerPhase);
  const disableStart = !playbackCan.start;
  const disablePause = !playbackCan.pause;
  const disableRoll = !playbackCan.roll || noEvents;
  const disableStop = !playbackCan.stop;
  const disableReload = !playbackCan.reload;

  const [goModeAction, goModeText] = useMemo(() => {
    if (isArmed) {
      return [setPlayback.start, 'Start'];
    } else if (isLast) {
      return [setPlayback.stop, 'Finish'];
    } else if (selectedEventIndex === null) {
      return [setPlayback.startNext, 'Start'];
    }
    return [setPlayback.startNext, 'Next'];
  }, [isArmed, isLast, selectedEventIndex]);

  return (
    <div className={style.buttonContainer}>
      <TapButton disabled={disableGo} onClick={goModeAction} aspect='fill' className={style.go}>
        {goModeText}
      </TapButton>
      <div className={style.playbackContainer}>
        <TapButton onClick={setPlayback.start} disabled={disableStart} theme={Playback.Play} active={isPlaying}>
          <IoPlay />
        </TapButton>

        <TapButton onClick={setPlayback.pause} disabled={disablePause} theme={Playback.Pause} active={isPaused}>
          <IoPause />
        </TapButton>
      </div>
      <div className={style.transportContainer}>
        <Tooltip label='Previous event' openDelay={tooltipDelayMid}>
          <TapButton onClick={setPlayback.previous} disabled={disablePrev}>
            <IoPlaySkipBack />
          </TapButton>
        </Tooltip>
        <Tooltip label='Next event' openDelay={tooltipDelayMid}>
          <TapButton onClick={setPlayback.next} disabled={disableNext}>
            <IoPlaySkipForward />
          </TapButton>
        </Tooltip>
      </div>
      <div className={style.extra}>
        <TapButton onClick={setPlayback.roll} disabled={disableRoll} theme={Playback.Roll} active={isRolling}>
          <IoTime />
        </TapButton>
        <Tooltip label='Reload event' openDelay={tooltipDelayMid}>
          <TapButton onClick={setPlayback.reload} disabled={disableReload}>
            <IoReload className={style.invertX} />
          </TapButton>
        </Tooltip>
        <Tooltip label='Unload Event' openDelay={tooltipDelayMid}>
          <TapButton onClick={setPlayback.stop} disabled={disableStop} theme={Playback.Stop}>
            <IoStop />
          </TapButton>
        </Tooltip>
      </div>
    </div>
  );
}
