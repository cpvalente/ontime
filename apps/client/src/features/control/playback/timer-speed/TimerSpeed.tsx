import { Button } from '@chakra-ui/react';

import style from './TimerSpeed.module.scss';

// TODO: extract and test
function mapRange(value: number, fromA_start: number, fromA_end: number, toB_start: number, toB_end: number): number {
  return ((value - fromA_start) * (toB_end - toB_start)) / (fromA_end - fromA_start) + toB_start;
}

export default function TimerSpeed() {
  const newSpeed = 1.23;
  const newSpeedIndicator = mapRange(newSpeed, 0.5, 2.0, 0, 100);

  console.log('newSpeedIndicator', newSpeedIndicator);

  const handleApply = () => {
    console.log('timerSpeedControl.apply');
  };

  const handleReset = () => {
    console.log('timerSpeedControl.apply');
  };

  const handleMeetSchedule = () => {
    console.log('timerSpeedControl.apply');
  };

  return (
    <div className={style.panelContainer}>
      <div className={style.label}>Timer speed</div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button size='sm' variant='ontime-subtle-white' onClick={handleApply}>
          Apply
        </Button>
        <Button size='sm' variant='ontime-subtle-white' onClick={handleReset}>
          Reset
        </Button>
        <Button size='sm' variant='ontime-subtle-white' onClick={handleMeetSchedule}>
          Meet schedule
        </Button>
      </div>
      <div>
        <span>1.0x</span>
        <span>{'->'}</span>
        <span className={style.highlight}>{`${newSpeed}x`}</span>
      </div>
      <div>
        <div className={style.speedContainer}>
          <div className={style.speedOverride} style={{ '--override': newSpeedIndicator }} />
          <div className={style.speedRegular} />
        </div>
        <div className={style.labels}>
          <span className={style.override} style={{ left: '66%' }}>{`${newSpeed}x`}</span>
          <span>0.5x</span>
          <span style={{ left: '33.33%' }}>1.0x</span>
          <span style={{ left: '66.66%' }}>1.5x</span>
          <span style={{ left: '100%' }}>2.0x</span>
        </div>
      </div>
    </div>
  );
}
