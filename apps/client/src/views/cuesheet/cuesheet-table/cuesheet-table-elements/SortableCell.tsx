import { CSSProperties, ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Header } from '@tanstack/react-table';

import type { ExtendedEntry } from '../../../../common/utils/rundownMetadata';

import style from '../CuesheetTable.module.scss';

interface SortableCellProps {
  header: Header<ExtendedEntry, unknown>;
  injectedStyles: CSSProperties;
  children: ReactNode;
}

export function SortableCell({ header, injectedStyles, children }: SortableCellProps) {
  const { column, colSpan } = header;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  // build drag styles
  const dragStyle = {
    ...injectedStyles,
    zIndex: isDragging ? 2 : 'inherit',
    cursor: isDragging ? 'grabbing' : 'grab',
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <th ref={setNodeRef} style={dragStyle} colSpan={colSpan} tabIndex={-1}>
      <div {...attributes} {...listeners}>
        {children}
      </div>
      <div
        onDoubleClick={() => header.column.resetSize()}
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        className={style.resizer}
      />
    </th>
  );
}
