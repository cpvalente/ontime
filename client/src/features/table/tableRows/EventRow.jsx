import React from 'react';
import style from '../Table.module.scss';

export default function EventRow(props) {
  const { row, index, selectedId } = props;
  const { key, ...restProps } = row.getRowProps();
  const selected = row.original.id === selectedId;
  return (
    <tr {...restProps} className={selected ? style.selected : ''}>
      <td className={style.indexColumn}>{index}</td>
      {row.cells.map((cell) => {
        const { key, style, ...restCellProps } = cell.getCellProps();
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
