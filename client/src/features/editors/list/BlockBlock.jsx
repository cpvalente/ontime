import { IconButton } from '@chakra-ui/button';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import AddIconBtn from '../../../common/components/buttons/AddIconBtn';
import DeleteIconBtn from '../../../common/components/buttons/DeleteIconBtn';
import style from './Block.module.css';

export default function BlockBlock(props) {
  const { eventsHandler, index, data } = props;

  const addHandler = () => {
    eventsHandler('add', { type: 'block', order: index + 1 });
  };
  const deleteHandler = () => {
    eventsHandler('delete', data.id);
  };

  return (
    <div className={style.block}>
      <div className={style.actionOverlay}>
        <DeleteIconBtn clickHandler={deleteHandler} />
        <AddIconBtn clickHandler={addHandler} />
      </div>
    </div>
  );
}
