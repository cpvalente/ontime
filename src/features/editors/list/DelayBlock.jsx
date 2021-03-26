import { IconButton } from '@chakra-ui/button';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { Box } from '@chakra-ui/layout';
import { useNumberInput } from '@chakra-ui/number-input';
import {
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from '@chakra-ui/slider';
import { useState } from 'react';
import style from './List.module.css';

export default function DelayBlock() {
  const [delay, setDelay] = useState(0);
  const { getIncrementButtonProps, getDecrementButtonProps } = useNumberInput({
    step: 1,
    defaultValue: 0,
    min: -60,
    max: 60,
  });

  const inc = getIncrementButtonProps();
  const dec = getDecrementButtonProps();

  const populateDelay = (val) => {
    console.log('set delay in parent', val);
  };

  return (
    <div className={style.delayContainer}>
      <div className={style.delayValue}>{`${delay} min`}</div>
      <Slider
        defaultValue={0}
        min={-60}
        max={60}
        step={5}
        onChange={(val) => setDelay(val)}
        onChangeEnd={(val) => populateDelay(val)}
      >
        <SliderTrack bg='orange.100'>
          <Box position='relative' right={10} />
          <SliderFilledTrack bg='orange' />
        </SliderTrack>
        <SliderThumb boxSize={4} />
      </Slider>
      <div className={style.actionOverlay}>
        <IconButton size='xs' icon={<MinusIcon />} colorScheme='red' />
        <IconButton size='xs' icon={<AddIcon />} colorScheme='blue' />
      </div>
    </div>
  );
}
