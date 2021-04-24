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
        <ActionButtons
          showDel
          deleteHandler={deleteHandler}
          showAdd
          addHandler={addHandler}
          showDelay
          delayHandler={delayHandler}
          showBlock
        />
      </div>
    </div>
  );
}
