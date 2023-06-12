import { Tooltip } from '@chakra-ui/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, Header } from '@tanstack/react-table';
import { OntimeRundownEntry } from 'ontime-types';

import { tooltipDelayFast } from '../../../ontimeConfig';

import styles from '../Table.module.scss';

interface SortableCellProps {
  column: object;
}

export default function SortableCell({ column }: SortableCellProps) {
  const { style, ...restColumn } = column.getHeaderProps();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  // build drag styles
  const dragStyle = {
    ...style,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <th {...restColumn} ref={setNodeRef} style={dragStyle} className={isDragging ? styles.dragging : ''}>
      <div {...attributes} {...listeners}>
        <Tooltip label={column.Header} openDelay={tooltipDelayFast}>
          {column.render('Header')}
        </Tooltip>
      </div>
      <div {...column.getResizerProps()} className={styles.resizer} />
    </th>
  );
}

interface DraggableColumnHeaderProps {
  header: Header<OntimeRundownEntry, unknown>
}
export function DraggableColumnHeader({ header }: DraggableColumnHeaderProps) {
  const { column, colSpan, isPlaceholder } = header;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  // build drag styles
  const dragStyle = {
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <th ref={setNodeRef} style={dragStyle} colSpan={colSpan}>
      <div {...attributes} {...listeners}>
        {isPlaceholder ? null : flexRender(column.columnDef.header, header.getContext())}
      </div>
    </th>
  );
}
