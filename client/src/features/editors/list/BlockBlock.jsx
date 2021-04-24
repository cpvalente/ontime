import DeleteIconBtn from '../../../common/components/buttons/DeleteIconBtn';
import ActionButtons from './ActionButtons';
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
        <ActionButtons
          showAdd
          addHandler={addHandler}
          showDelay
          delayHandler={delayHandler}
        />
      </div>
    </div>
  );
}
