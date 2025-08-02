import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import style from './RundownBlockEnd.module.scss';

interface BlockEndProps {
  id: string;
  colour?: string;
}

export default function RundownBlockEnd({ id, colour }: BlockEndProps) {
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    data: {
      type: 'end-block',
    },
    animateLayoutChanges: () => false,
    disabled: true, // we do not want to drag end blocks
  });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={style.blockEnd}
      ref={setNodeRef}
      {...dragAttributes}
      {...dragListeners}
      style={{
        ...dragStyle,
        ...(colour ? { '--user-bg': colour } : {}),
      }}
      tabIndex={-1}
    />
  );
}
