import React from 'react';
import { Tooltip } from '@chakra-ui/tooltip';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from 'prop-types';

import styles from '../Table.module.scss';

export default function SortableCell({ column }) {
  const { style, ...restColumn } = column.getHeaderProps();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  // prevent scaling on drag
  const cssTransform = {
    ...transform,
    scaleX: 1,
    scaleY: 1,
  }

  // build drag styles
  const dragStyle = {
    transform: CSS.Transform.toString(cssTransform),
    transition,
    ...style,
  };

  return (
    <th {...restColumn} ref={setNodeRef} style={{...dragStyle}} className={isDragging ? styles.dragging: ''}>
      <div {...attributes} {...listeners}>
        <Tooltip label={column.Header} openDelay={300}>
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
