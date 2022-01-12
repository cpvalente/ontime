import { Draggable } from 'react-beautiful-dnd';
import { FiMoreVertical } from 'react-icons/fi';
import { millisToMinutes } from 'common/utils/dateConfig';
import ActionButtons from '../list/ActionButtons';
import DeleteIconBtn from 'common/components/buttons/DeleteIconBtn';
import ApplyIconBtn from 'common/components/buttons/ApplyIconBtn';
import DelayInput from 'common/input/DelayInput';
import style from './DelayBlock.module.css';
import PropTypes from 'prop-types';

export default function DelayBlock(props) {
  const { eventsHandler, data, index, actionHandler } = props;

  const applyDelayHandler = () => {
    eventsHandler('applyDelay', { id: data.id, duration: data.duration });
  };

  let delayValue = data.duration != null ? millisToMinutes(data.duration) : undefined;
  return (
    <Draggable key={data.id} draggableId={data.id} index={index}>
      {(provided) => (
        <div className={style.delay} {...provided.draggableProps} ref={provided.innerRef}>
          <span className={style.drag} {...provided.dragHandleProps}>
            <FiMoreVertical />
          </span>
          <DelayInput className={style.input} value={delayValue} actionHandler={actionHandler} />
          <div className={style.actionOverlay}>
            <ApplyIconBtn clickhandler={applyDelayHandler} />
            <DeleteIconBtn actionHandler={actionHandler} />
            <ActionButtons showAdd actionHandler={actionHandler} />
          </div>
        </div>
      )}
    </Draggable>
  );
}

DelayBlock.propTypes = {
  eventsHandler: PropTypes.func.isRequired,
  data: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  actionHandler: PropTypes.func.isRequired,
};
