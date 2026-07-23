import { Playback, SimpleDirection, SimplePlayback } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';
import { IoArrowDown, IoArrowUp, IoPause, IoPlay, IoStop } from 'react-icons/io5';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import useSettings from '../../../../common/hooks-query/useSettings';
import { setAuxTimer, useAuxTimerControl, useAuxTimerTime } from '../../../../common/hooks/useSocket';
import { getAuxTimerLabel } from '../../../../common/utils/auxTimerUtils';
import TapButton from '../tap-button/TapButton';

import style from './AuxTimer.module.scss';

interface AuxTimerProps {
  index: number;
}

export function AuxTimer({ index }: AuxTimerProps) {
  const { playback, direction } = useAuxTimerControl(index);
  const { data: settings } = useSettings();

  const { stop, setDirection } = setAuxTimer;

  const label = getAuxTimerLabel(settings.auxTimerNames, index, `Aux Timer ${index}`);

  const toggleDirection = () => {
    const newDirection = direction === SimpleDirection.CountDown ? SimpleDirection.CountUp : SimpleDirection.CountDown;
    setDirection(index, newDirection);
  };

  const isActive = playback !== SimplePlayback.Stop;
  const playbackAction = playback === SimplePlayback.Start ? 'pause' : 'play';

  return (
    <label className={style.label}>
      {label}
      <div className={style.controls}>
        <div className={style.input}>
          <AuxTimerInput index={index} isActive={isActive} placeholder={label} />
          <TapButton onClick={toggleDirection} aspect='tight' disabled={isActive}>
            {direction === SimpleDirection.CountDown && <IoArrowDown data-testid={`aux-timer-direction-${index}`} />}
            {direction === SimpleDirection.CountUp && <IoArrowUp data-testid={`aux-timer-direction-${index}`} />}
          </TapButton>
        </div>
        <div className={style.twoSides}>
          <AuxTogglePlay index={index} action={playbackAction} />
          <TapButton onClick={() => stop(index)} theme={Playback.Stop} disabled={!isActive}>
            <IoStop data-testid={`aux-timer-stop-${index}`} />
          </TapButton>
        </div>
      </div>
    </label>
  );
}

interface AuxTimerInputProps {
  index: number;
  isActive: boolean;
  placeholder: string;
}

function AuxTimerInput({ index, isActive, placeholder }: AuxTimerInputProps) {
  const newTimeInMs = useAuxTimerTime(index);
  const { setDuration } = setAuxTimer;

  const handleTimeUpdate = (_field: string, value: string) => {
    const newTimeInMs = parseUserTime(value);
    setDuration(index, newTimeInMs);
  };

  if (isActive) {
    return (
      <div className={style.fakeInput} data-testid={`time-label-aux${index}`}>
        {millisToString(newTimeInMs)}
      </div>
    );
  }

  return (
    <TimeInput submitHandler={handleTimeUpdate} name={`aux${index}`} time={newTimeInMs} placeholder={placeholder} />
  );
}

interface AuxTogglePlayProps {
  index: number;
  action: 'play' | 'pause';
}

function AuxTogglePlay({ index, action }: AuxTogglePlayProps) {
  const { start, pause } = setAuxTimer;

  if (action === 'play') {
    return (
      <TapButton onClick={() => start(index)} theme={Playback.Play}>
        <IoPlay data-testid={`aux-timer-start-${index}`} />
      </TapButton>
    );
  }

  return (
    <TapButton onClick={() => pause(index)} theme={Playback.Pause}>
      <IoPause data-testid={`aux-timer-pause-${index}`} />
    </TapButton>
  );
}
