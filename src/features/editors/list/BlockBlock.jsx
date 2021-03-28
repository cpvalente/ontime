import { IconButton } from '@chakra-ui/button';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import style from './List.module.css';

export default function BlockBlock(props) {
  return (
    <div className={style.blockContainer}>
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
