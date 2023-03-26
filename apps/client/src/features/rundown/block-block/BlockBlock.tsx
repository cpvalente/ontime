import { useEffect, useRef } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import { OntimeBlock, OntimeEvent } from 'ontime-types';

import { cx } from '../../../common/utils/styleUtils';
import BlockActionMenu from '../event-block/composite/BlockActionMenu';
import { EventItemActions } from '../RundownEntry';

import style from './BlockBlock.module.scss';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BlockBlockProps {
  index: number;
  data: OntimeBlock;
  hasCursor: boolean;
  actionHandler: (action: EventItemActions, payload?: number | { field: keyof OntimeEvent; value: unknown }) => void;
}

export default function BlockBlock(props: BlockBlockProps) {
  const { index, data, hasCursor, actionHandler } = props;
  const handleRef = useRef<null | HTMLSpanElement>(null);

  const {
    isDragging,
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    animateLayoutChanges: () => true,
    id: data.id,
  });

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  useEffect(() => {
    if (hasCursor) {
      handleRef?.current?.focus();
    }
  }, [hasCursor]);

  const blockClasses = cx([style.block, hasCursor ? style.hasCursor : null]);

  return (
    <div className={blockClasses} ref={setNodeRef} style={dragStyle}>
      <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
        <IoReorderTwo />
      </span>
      <BlockActionMenu className={style.actionOverlay} showAdd showDelay enableDelete actionHandler={actionHandler} />
    </div>
  );
}
