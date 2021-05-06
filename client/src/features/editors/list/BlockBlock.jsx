import { Draggable } from 'react-beautiful-dnd';
import { FiMoreVertical } from 'react-icons/fi';
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
    <Draggable key={data.id} draggableId={data.id} index={index}>
      {(provided) => (
        <div
          className={style.block}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <span className={style.drag} {...provided.dragHandleProps}>
            <FiMoreVertical />
          </span>
          <div className={style.actionOverlay}>
            <DeleteIconBtn clickhandler={deleteHandler} />
            <ActionButtons
              showAdd
              addHandler={addHandler}
              showDelay
              delayHandler={delayHandler}
            />
          </div>
        </div>
      )}
    </Draggable>
  );
}
