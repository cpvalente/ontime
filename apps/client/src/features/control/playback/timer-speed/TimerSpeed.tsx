import { useState } from 'react';
import { Slider, SliderFilledTrack, SliderMark, SliderThumb, SliderTrack } from '@chakra-ui/react';

import { useTimerSpeed } from '../../../../common/hooks/useSocket';

import MeetSchedule from './MeetSchedule';

import style from './TimerSpeed.module.scss';

const labelStyles = {
  mt: '2',
  ml: '-3',
  fontSize: 'sm',
  color: 'gray',
};

//TODO: styling breaks when Extracted

export default function TimerSpeed() {
  const { speed } = useTimerSpeed();
  const [newSpeed, setNewSpeed] = useState(1);

  return (
    <div className={style.panelContainer}>
      <div className={style.label}>Timer speed</div>
      <MeetSchedule speed={speed} newSpeed={newSpeed} setNewSpeed={setNewSpeed} />
      <Slider size='lg' value={newSpeed} min={0.5} max={2.0} step={0.05} onChange={(v) => setNewSpeed(v)}>
        <SliderMark
          value={newSpeed}
          {...labelStyles}
          color={newSpeed > 1.5 ? 'red.500' : newSpeed > 1 ? 'orange.500' : newSpeed < 1 ? 'blue.500' : ''}
        />
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
        <SliderTrack height='.75em' rounded='lg' bg='gray'>
          <SliderFilledTrack
            bg={newSpeed > 1.5 ? 'red.500' : newSpeed > 1 ? 'orange.500' : newSpeed < 1 ? 'blue.500' : ''}
          />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </div>
  );
}
