import AddIconBtn from '../../../common/components/buttons/AddIconBtn';
import DelayIconBtn from '../../../common/components/buttons/DelayIconBtn';
import DeleteIconBtn from '../../../common/components/buttons/DeleteIconBtn';
import style from './Block.module.css';

export default function BlockBlock(props) {
  const { eventsHandler, index, data } = props;

  const addHandler = () => {
    eventsHandler('add', { type: 'event', order: index + 1 });
  };
  const deleteHandler = () => {
    eventsHandler('delete', data.id);
  };
  const delayHandler = () => {
    eventsHandler('add', { type: 'delay', order: index + 1 });
  };

  return (
    <div className={style.block}>
      <div className={style.actionOverlay}>
        <DeleteIconBtn clickHandler={deleteHandler} />
        <AddIconBtn clickHandler={addHandler} />
        <DelayIconBtn clickHandler={delayHandler} />
      </div>
    </div>
  );
}
