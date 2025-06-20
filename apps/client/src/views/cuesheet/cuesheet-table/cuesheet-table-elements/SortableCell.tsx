import { CSSProperties, ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Header } from '@tanstack/react-table';
import { OntimeRundownEntry } from 'ontime-types';

import styles from '../CuesheetTable.module.scss';

interface SortableCellProps {
  header: Header<OntimeRundownEntry, unknown>;
  style: CSSProperties;
  children: ReactNode;
}

export function SortableCell({ header, style, children }: SortableCellProps) {
  const { column, colSpan } = header;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  // build drag styles
  const dragStyle = {
    ...style,
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <th ref={setNodeRef} style={dragStyle} colSpan={colSpan} tabIndex={-1}>
      <div {...attributes} {...listeners}>
        {children}
      </div>
      <div
        {...{
          onMouseDown: header.getResizeHandler(),
          onTouchStart: header.getResizeHandler(),
        }}
        className={styles.resizer}
      />
    </th>
  );
}
