import { Draggable } from 'react-beautiful-dnd';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';

import { OntimeBlock, OntimeEvent } from '../../../common/models/EventTypes';
import BlockActionMenu from '../event-block/composite/BlockActionMenu';
import { EventItemActions } from '../RundownEntry';

import style from './BlockBlock.module.scss';

interface BlockBlockProps {
  index: number;
  data: OntimeBlock;
  actionHandler: (action: EventItemActions, payload?: number | { field: keyof OntimeEvent, value: unknown }) => void;
}

export default function BlockBlock(props: BlockBlockProps) {
  const { index, data, actionHandler } = props;

  return (
    <Draggable key={data.id} draggableId={data.id} index={index}>
      {(provided) => (
        <div className={style.block} {...provided.draggableProps} ref={provided.innerRef}>
          <span className={style.drag} {...provided.dragHandleProps}>
            <IoReorderTwo />
          </span>
          <BlockActionMenu
            className={style.actionOverlay}
            showAdd
            showDelay
            enableDelete
            actionHandler={actionHandler}
          />
        </div>
      )}
    </Draggable>
  );
}
