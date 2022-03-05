import React from 'react';
import PropTypes from 'prop-types';
import style from '../Table.module.scss';

export default function EventRow(props) {
  const { row, index, selectedId, delay } = props;
  const selected = row.original.id === selectedId;
  return (
    <tr {...row.getRowProps()} className={selected ? style.selected : ''}>
      <td className={style.indexColumn}>{index}</td>
      {row.cells.map((cell) => {
        const { key, style, ...restCellProps } = cell.getCellProps();

        // Inject delay value if exits
        if (delay !== 0 && delay != null) {
          const col = cell.column.Header;
          if (col === 'End' || col === 'Start') {
            cell.delayed = cell.value + delay;
          }
        }

        return (
          <td
            key={key}
            style={{ ...style, backgroundColor: row.original.colour || 'none' }}
            {...restCellProps}
          >
            {cell.render('Cell')}
          </td>
        );
      })}
    </tr>
  );
}

EventRow.propTypes = {
  row: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  selectedId: PropTypes.string,
  delay: PropTypes.number,
};
