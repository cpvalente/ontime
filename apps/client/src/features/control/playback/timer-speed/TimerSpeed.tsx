import { memo, useEffect, useState } from 'react';
import { Button, Slider, SliderFilledTrack, SliderMark, SliderThumb, SliderTrack } from '@chakra-ui/react';
import { MaybeNumber } from 'ontime-types';

import { setTimerSpeed, useTimerSpeed } from '../../../../common/hooks/useSocket';
import { cx } from '../../../../common/utils/styleUtils';

import TimerSchedule from './TimerSchedule';

import style from './TimerSpeed.module.scss';

interface TimerSpeedProps {
  isPlaying: boolean;
  eventIndex: MaybeNumber;
}

export default memo(TimerSpeed);

function TimerSpeed(props: TimerSpeedProps) {
  const { isPlaying, eventIndex } = props;
  const { speed } = useTimerSpeed();
  const [newSpeed, setNewSpeed] = useState(1);
  const { setSpeed } = setTimerSpeed;

  // when a new timer is set, we want to reset the speed
  useEffect(() => {
    setNewSpeed(1);
  }, [eventIndex]);

  const handleApply = () => setSpeed(newSpeed);
  const handleReset = () => {
    setNewSpeed(1.0);
    setSpeed(1.0);
  };

  const canReset = isPlaying && speed === newSpeed && newSpeed !== 1;
  const canApply = isPlaying && speed !== newSpeed;
  const willChangeSpeed = speed === 1 && !canApply;

  return (
    <div className={style.panelContainer}>
      <TimerSchedule speed={speed} newSpeed={newSpeed} />
      <div className={style.inlineApart}>
        <div className={style.entry}>
          <span className={cx([willChangeSpeed && style.disabled])}>{`${speed}x`}</span>
          {newSpeed !== speed && <span className={style.highlight}>{` ⇢ ${newSpeed}x`}</span>}
        </div>
        <div className={style.inlineSiblings}>
          <Button size='sm' variant='ontime-subtle-white' onClick={handleReset} isDisabled={!canReset}>
            Reset
          </Button>
          <Button size='sm' variant='ontime-subtle-white' onClick={handleApply} isDisabled={!canApply}>
            Apply
          </Button>
        </div>
      </div>
      <Slider
        variant={newSpeed === 1 ? 'ontime' : 'ontime-highlight'}
        defaultValue={newSpeed}
        min={0.5}
        max={2.0}
        step={0.01}
        onChange={(v) => setNewSpeed(v)}
        value={newSpeed}
        isDisabled={!isPlaying}
      >
        <SliderMark value={0.5}>0.5x</SliderMark>
        <SliderMark value={1.0}>1.0x</SliderMark>
        <SliderMark value={1.5}>1.5x</SliderMark>
        <SliderMark value={2.0}>2.0x</SliderMark>
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </div>
  );
}
