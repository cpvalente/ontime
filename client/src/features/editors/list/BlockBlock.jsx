import { IconButton } from '@chakra-ui/button';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import style from './List.module.css';

export default function BlockBlock(props) {
  const { eventsHandler, index, data } = props;
  return (
    <div className={style.blockContainer}>
      <div className={style.actionOverlay}>
        <IconButton
          size='xs'
          icon={<MinusIcon />}
          colorScheme='red'
          onClick={() => eventsHandler('delete', data.id)}
        />
        <IconButton
          size='xs'
          icon={<AddIcon />}
          colorScheme='blue'
          onClick={() =>
            eventsHandler('add', { type: 'event', order: index + 1 })
          }
        />
      </div>
    </div>
  );
}
