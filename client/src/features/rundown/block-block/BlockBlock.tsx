import { useEffect, useRef } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';

import { OntimeBlock, OntimeEvent } from '../../../common/models/EventTypes';
import { cx } from '../../../common/utils/styleUtils';
import BlockActionMenu from '../event-block/composite/BlockActionMenu';
import { EventItemActions } from '../RundownEntry';

import style from './BlockBlock.module.scss';

interface BlockBlockProps {
  index: number;
  data: OntimeBlock;
  hasCursor: boolean;
  actionHandler: (action: EventItemActions, payload?: number | { field: keyof OntimeEvent, value: unknown }) => void;
}

export default function BlockBlock(props: BlockBlockProps) {
  const { index, data, hasCursor, actionHandler } = props;
  const onFocusRef = useRef<null | HTMLSpanElement>(null);

  useEffect(() => {
    if (hasCursor) {
      onFocusRef?.current?.focus();
    }
  }, [hasCursor])

  const blockClasses = cx([
    style.block,
    hasCursor ? style.hasCursor : null,
  ]);

  return (
    <Draggable key={data.id} draggableId={data.id} index={index}>
      {(provided) => (
        <div className={blockClasses} {...provided.draggableProps} ref={provided.innerRef}>
          <span className={style.drag} {...provided.dragHandleProps} ref={onFocusRef}>
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
