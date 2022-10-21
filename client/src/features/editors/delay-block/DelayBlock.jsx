import { useCallback } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Button, HStack } from '@chakra-ui/react';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { IoRemove } from '@react-icons/all-files/io5/IoRemove';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import ActionButtons from 'common/components/buttons/ActionButtons';
import TooltipLoadingActionBtn from 'common/components/buttons/TooltipLoadingActionBtn';
import DelayInput from 'common/components/input/DelayInput';
import { useEventAction } from 'common/hooks/useEventAction';
import { millisToMinutes } from 'common/utils/dateConfig';
import PropTypes from 'prop-types';

import style from './DelayBlock.module.scss';

export default function DelayBlock(props) {
  const { data, index, actionHandler } = props;
  const { applyDelay, deleteEvent, updateEvent } = useEventAction();

  const applyDelayHandler = useCallback(() => {
    applyDelay(data.id);
  }, [data.id, applyDelay]);

  const deleteHandler = useCallback(() => {
    deleteEvent(data.id);
  }, [data.id, deleteEvent]);

  const delaySubmitHandler = useCallback(
    (value) => {
      const newEvent = {
        id: data.id,
        duration: value * 60000,
      };

      updateEvent(newEvent);
    },
    [data.id, updateEvent]
  );

  const delayValue = data.duration != null ? millisToMinutes(data.duration) : undefined;

  return (
    <Draggable key={data.id} draggableId={data.id} index={index}>
      {(provided) => (
        <div className={style.delay} {...provided.draggableProps} ref={provided.innerRef}>
          <span className={style.drag} {...provided.dragHandleProps}>
            <IoReorderTwo />
          </span>
          <DelayInput
            className={style.input}
            value={delayValue}
            submitHandler={delaySubmitHandler}
          />
          <HStack spacing='4px' className={style.actionOverlay}>
            <Button
              onClick={applyDelayHandler}
              size='sm'
              colorScheme='orange'
              _hover={{ bg: 'orange.400' }}
              leftIcon={<FiCheck />}
            >
              Apply delay
            </Button>
            <TooltipLoadingActionBtn
              clickHandler={deleteHandler}
              icon={<IoRemove />}
              tooltip='Delete'
              variant='ghost'
              _hover={{ bg: 'red.400', color: 'white' }}
              color='red.500'
              size='sm'
            />
            <ActionButtons showAdd actionHandler={actionHandler} />
          </HStack>
        </div>
      )}
    </Draggable>
  );
}

DelayBlock.propTypes = {
  data: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  actionHandler: PropTypes.func.isRequired,
};
