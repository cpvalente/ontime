import React, { useCallback } from 'react';
import { HStack } from '@chakra-ui/react';
import { Draggable } from 'react-beautiful-dnd';
import { FiMoreVertical } from '@react-icons/all-files/fi/FiMoreVertical';
import { millisToMinutes } from 'common/utils/dateConfig';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import ActionButtons from '../list/ActionButtons';
import DeleteIconBtn from 'common/components/buttons/DeleteIconBtn';
import DelayInput from 'common/input/DelayInput';
import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
import style from './DelayBlock.module.scss';
import PropTypes from 'prop-types';

export default function DelayBlock(props) {
  const { eventsHandler, data, index, actionHandler } = props;

  const applyDelayHandler = useCallback(() => {
    eventsHandler('applyDelay', { id: data.id, duration: data.duration });
  }, [data.duration, data.id, eventsHandler]);

  const delayValue = data.duration != null ? millisToMinutes(data.duration) : undefined;
  return (
    <Draggable key={data.id} draggableId={data.id} index={index}>
      {(provided) => (
        <div className={style.delay} {...provided.draggableProps} ref={provided.innerRef}>
          <span className={style.drag} {...provided.dragHandleProps}>
            <FiMoreVertical />
          </span>
          <DelayInput className={style.input} value={delayValue} actionHandler={actionHandler} />
          <HStack spacing='0.5em' className={style.actionOverlay}>
            <TooltipActionBtn
              clickHandler={applyDelayHandler}
              icon={<FiCheck />}
              colorScheme='orange'
              tooltip='Apply delays'
            />
            <DeleteIconBtn actionHandler={actionHandler} />
            <ActionButtons showAdd actionHandler={actionHandler} />
          </HStack>
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
