import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { HStack } from '@chakra-ui/react';
import { FiMoreVertical } from '@react-icons/all-files/fi/FiMoreVertical';
import { IoRemove } from '@react-icons/all-files/io5/IoRemove';
import PropTypes from 'prop-types';

import ActionButtons from '../../../common/components/buttons/ActionButtons';
import TooltipLoadingActionBtn from '../../../common/components/buttons/TooltipLoadingActionBtn';

import style from './BlockBlock.module.scss';

export default function BlockBlock(props) {
  const { index, data, actionHandler } = props;

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
          <HStack spacing='0.5em' className={style.actionOverlay}>
            <TooltipLoadingActionBtn
              clickHandler={() => actionHandler('delete')}
              icon={<IoRemove />}
              colorScheme='red'
              tooltip='Delete'
              _hover={{ bg: 'red.400' }}
            />
            <ActionButtons showAdd showDelay actionHandler={actionHandler} />
          </HStack>
        </div>
      )}
    </Draggable>
  );
}


BlockBlock.propTypes = {
  index: PropTypes.number.isRequired,
  data: PropTypes.object.isRequired,
  actionHandler: PropTypes.func.isRequired,
};
