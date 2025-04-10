import { PropsWithChildren, useRef } from 'react';
import { IoReorderTwo } from 'react-icons/io5';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OntimeBlock } from 'ontime-types';

import { cx } from '../../../common/utils/styleUtils';
import EditableBlockTitle from '../common/EditableBlockTitle';

import style from './BlockBlock.module.scss';

interface BlockBlockProps {
  data: OntimeBlock;
  hasCursor: boolean;
}

export default function BlockBlock(props: PropsWithChildren<BlockBlockProps>) {
  const { data, hasCursor, children } = props;

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

  const blockClasses = cx([style.block, hasCursor ? style.hasCursor : null]);

  return (
    <div className={blockClasses} ref={setNodeRef} style={dragStyle}>
      <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
        <IoReorderTwo />
      </span>
      <EditableBlockTitle title={data.title} eventId={data.id} placeholder='Block title' />
      <button>+++</button>
      <div>{children}</div>
    </div>
  );
}
