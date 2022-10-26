import { Draggable } from 'react-beautiful-dnd';
import { HStack } from '@chakra-ui/react';
import { IoRemove } from '@react-icons/all-files/io5/IoRemove';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import PropTypes from 'prop-types';

import ActionButtons from '../../../common/components/buttons/ActionButtons';
import TooltipLoadingActionBtn from '../../../common/components/buttons/TooltipLoadingActionBtn';

import style from './BlockBlock.module.scss';

export default function BlockBlock(props) {
  const { index, data, actionHandler } = props;

  return (
    <Draggable key={data.id} draggableId={data.id} index={index}>
      {(provided) => (
        <div className={style.block} {...provided.draggableProps} ref={provided.innerRef}>
          <span className={style.drag} {...provided.dragHandleProps}>
            <IoReorderTwo />
          </span>
          <HStack spacing='4px' className={style.actionOverlay}>
            <TooltipLoadingActionBtn
              clickHandler={() => actionHandler('delete')}
              icon={<IoRemove />}
              tooltip='Delete'
              variant='outline'
              colorScheme='white'
              size='sm'
              aria-label='Delete'
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
