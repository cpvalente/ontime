import { Box } from '@chakra-ui/layout';
import {
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from '@chakra-ui/slider';
import { useEffect, useState } from 'react';
import AddIconBtn from '../../../common/components/buttons/AddIconBtn';
import DeleteIconBtn from '../../../common/components/buttons/DeleteIconBtn';
import style from './Block.module.css';

export default function DelayBlock(props) {
  const [delay, setDelay] = useState(0);
  const { data, eventsHandler, index, updateData } = props;

  // update delay value in parent
  const populateDelay = (value) => {
    // check if value has changed
    if (data.timerDuration !== value) {
      // create object with new field
      const newData = { ...data, timerDuration: delay };

      // request update in parent
      updateData(index, newData);
    }
  };

  // update delay value in state
  useEffect(() => {
    setDelay(data.timerDuration);
  }, [data]);
  const addHandler = () => {
  };
  const deleteHandler = () => {
    eventsHandler('delete', data.id);
  };

  return (
    <div className={style.delay}>
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
        <DeleteIconBtn clickHandler={deleteHandler} />
        <AddIconBtn clickHandler={addHandler} />
      </div>
    </div>
  );
}
