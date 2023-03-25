import { Tooltip } from '@chakra-ui/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from 'prop-types';

import { tooltipDelayFast } from '../../../ontimeConfig';

import styles from '../Table.module.scss';

export default function SortableCell({ column }) {
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

SortableCell.propTypes = {
  column: PropTypes.object.isRequired,
};
