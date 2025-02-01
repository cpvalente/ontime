import { useState } from 'react';
import { Slider, SliderFilledTrack, SliderMark, SliderThumb, SliderTrack } from '@chakra-ui/react';

import { useTimerSpeed } from '../../../../common/hooks/useSocket';

import MeetSchedule from './MeetSchedule';

import style from './TimerSpeed.module.scss';

const labelStyles = {
  mt: '2',
  ml: '-2.5',
  fontSize: 'sm',
};

export default function TimerSpeed() {
  const { speed } = useTimerSpeed();
  const [newSpeed, setNewSpeed] = useState(1);

  return (
    <div className={style.panelContainer}>
      <div className={style.label}>Timer speed</div>
      <MeetSchedule speed={speed} newSpeed={newSpeed} />
      <Slider defaultValue={newSpeed} min={0.5} max={2.0} step={0.01} onChange={(v) => setNewSpeed(v)}>
        <SliderMark value={0.5} {...labelStyles}>
          0.5x
        </SliderMark>
        <SliderMark value={1.0} {...labelStyles}>
          1.0x
        </SliderMark>
        <SliderMark value={1.5} {...labelStyles}>
          1.5x
        </SliderMark>
        <SliderMark value={2.0} {...labelStyles}>
          2.0x
        </SliderMark>
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </div>
  );
}
