import React, { useCallback } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { HStack } from '@chakra-ui/react';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiMoreVertical } from '@react-icons/all-files/fi/FiMoreVertical';
import { IoRemove } from '@react-icons/all-files/io5/IoRemove';
import DelayInput from 'common/input/DelayInput';
import { millisToMinutes } from 'common/utils/dateConfig';
import PropTypes from 'prop-types';

import ActionButtons from '../../../common/components/buttons/ActionButtons';
import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
import TooltipLoadingActionBtn from '../../../common/components/buttons/TooltipLoadingActionBtn';

import style from './DelayBlock.module.scss';

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
              _hover={{ bg: 'orange.400' }}
            />
            <TooltipLoadingActionBtn
              clickHandler={() => actionHandler('delete')}
              icon={<IoRemove />}
              colorScheme='red'
              tooltip='Delete'
              _hover={{ bg: 'red.400' }}
            />
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
