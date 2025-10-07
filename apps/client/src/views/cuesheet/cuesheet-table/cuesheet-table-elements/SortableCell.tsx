import { CSSProperties, ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Header } from '@tanstack/react-table';

import type { ExtendedEntry } from '../../../../common/utils/rundownMetadata';

import style from '../CuesheetTable.module.scss';

interface SortableCellProps {
  columnId: string;
  colSpan: number;
  injectedStyles: CSSProperties;
  children: ReactNode;
  draggable: ReactNode;
}

export function SortableCell({ columnId, colSpan, injectedStyles, children, draggable }: SortableCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: columnId,
  });

  // build drag styles
  const dragStyle = {
    ...injectedStyles,
    zIndex: isDragging ? 2 : 'inherit',
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <th ref={setNodeRef} style={dragStyle} colSpan={colSpan} tabIndex={-1}>
      <div {...attributes} {...listeners}>
        {children}
      </div>
      {draggable}
    </th>
  );
}

export function TableCell({ colSpan, injectedStyles, children, draggable }: SortableCellProps) {
  return (
    <th style={injectedStyles} colSpan={colSpan} tabIndex={-1}>
      <div>{children}</div>
      {draggable}
    </th>
  );
}

interface DraggableProps {
  header: Header<ExtendedEntry, unknown>;
}

export function Draggable({ header }: DraggableProps) {
  return (
    <div
      onDoubleClick={() => header.column.resetSize()}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      className={style.resizer}
    />
  );
}
