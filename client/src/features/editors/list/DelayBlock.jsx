import { Draggable } from 'react-beautiful-dnd';
import { FiMoreVertical } from 'react-icons/fi';
import { millisToMinutes } from '../../../common/dateConfig';
import TimeInput from '../../../common/input/TimeInput';
import style from './Block.module.css';
import ActionButtons from './ActionButtons';
import DeleteIconBtn from '../../../common/components/buttons/DeleteIconBtn';
import ApplyIconBtn from '../../../common/components/buttons/ApplyIconBtn';

export default function DelayBlock(props) {
  const { data, eventsHandler, index } = props;

  const addHandler = () => {
    eventsHandler('add', { type: 'event', order: index + 1 });
  };

  const submitHandler = (value) => {
    // convert to ms and patch
    eventsHandler('patch', { id: data.id, duration: value * 1000 * 60 });
  };

  const deleteHandler = () => {
    eventsHandler('delete', data.id);
  };

  const applyDelayHandler = () => {
    eventsHandler('applyDelay', { id: data.id, duration: data.duration });
  };

  let delayValue =
    data.duration != null ? millisToMinutes(data.duration) : undefined;
  return (
    <Draggable key={data.id} draggableId={data.id} index={index}>
      {(provided) => (
        <div
          className={style.delay}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <span className={style.drag} {...provided.dragHandleProps}>
            <FiMoreVertical />
          </span>
          <TimeInput value={delayValue} submitHandler={submitHandler} />
          <div className={style.actionOverlay}>
            <ApplyIconBtn clickhandler={applyDelayHandler} />
            <DeleteIconBtn clickhandler={deleteHandler} />
            <ActionButtons showAdd addHandler={addHandler} />
          </div>
        </div>
      )}
    </Draggable>
  );
}
