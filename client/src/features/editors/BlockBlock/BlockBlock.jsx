import React from 'react';
import { HStack } from '@chakra-ui/react';
import { Draggable } from 'react-beautiful-dnd';
import { FiMoreVertical } from '@react-icons/all-files/fi/FiMoreVertical';
import DeleteIconBtn from 'common/components/buttons/DeleteIconBtn';
import ActionButtons from '../list/ActionButtons';
import style from './BlockBlock.module.scss';
import PropTypes from 'prop-types';

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
            <DeleteIconBtn actionHandler={actionHandler} />
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
