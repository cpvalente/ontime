import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import style from './RundownGroupEnd.module.scss';

interface RundownGroupEndProps {
  id: string;
  colour?: string;
}

export default function RundownGroupEnd({ id, colour }: RundownGroupEndProps) {
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    data: {
      type: 'end-group',
    },
    animateLayoutChanges: () => false,
    disabled: true, // we do not want to drag end groups
  });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={style.groupEnd}
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
