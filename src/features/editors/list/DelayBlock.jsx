import { IconButton } from '@chakra-ui/button';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { Box } from '@chakra-ui/layout';
import {
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from '@chakra-ui/slider';
import { useEffect, useState } from 'react';
import style from './List.module.css';

export default function DelayBlock(props) {
  const [delay, setDelay] = useState(0);
  const { data, ...rest } = props;

  // update delay value in parent
  const populateDelay = (value) => {
    // check if value has changed
    if (data.timerDuration !== value) {
      // create object with new field
      const newData = { ...data, timerDuration: delay };

      // request update in parent
      props.updateData(props.index, newData);
    }
  };

  // update delay value in state
  useEffect(() => {
    setDelay(data.timerDuration);
  }, [data]);

  return (
    <div className={style.delayContainer}>
      <div className={style.delayValue}>{`${delay} min`}</div>
      <Slider
        defaultValue={data.timerDuration}
        min={0}
        max={60}
        step={5}
        onChange={(value) => setDelay(value)}
        onChangeEnd={(value) => populateDelay(value)}
      >
        <SliderTrack bg='orange.100'>
          <Box position='relative' right={10} />
          <SliderFilledTrack bg='orange' />
        </SliderTrack>
        <SliderThumb boxSize={4} />
      </Slider>
      <div className={style.actionOverlay}>
        <IconButton
          size='xs'
          icon={<MinusIcon />}
          colorScheme='red'
          onClick={() => props.deleteEvent(props.index)}
        />
        <IconButton
          size='xs'
          icon={<AddIcon />}
          colorScheme='blue'
          onClick={() => props.createEvent(props.index)}
        />
      </div>
    </div>
  );
}
