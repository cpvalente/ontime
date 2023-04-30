import { useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import { OntimeBlock, OntimeEvent } from 'ontime-types';

import { cx } from '../../../common/utils/styleUtils';
import EditableBlockTitle from '../common/EditableBlockTitle';
import BlockActionMenu from '../event-block/composite/BlockActionMenu';
import type { EventItemActions } from '../RundownEntry';

import style from './BlockBlock.module.scss';

interface BlockBlockProps {
  data: OntimeBlock;
  hasCursor: boolean;
  actionHandler: (
    action: EventItemActions,
    payload?:
      | number
      | {
          field: keyof Omit<OntimeEvent, 'duration'> | 'durationOverride';
          value: unknown;
        },
  ) => void;
}

export default function BlockBlock(props: BlockBlockProps) {
  const { data, hasCursor, actionHandler } = props;
  const handleRef = useRef<null | HTMLSpanElement>(null);

  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: data.id,
    animateLayoutChanges: () => false,
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
      <EditableBlockTitle title={data.title} eventId={data.id} placeholder='Block title' />
      <BlockActionMenu className={style.actionMenu} showAdd showDelay enableDelete actionHandler={actionHandler} />
    </div>
  );
}
