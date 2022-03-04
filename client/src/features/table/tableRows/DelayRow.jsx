import React from 'react';
import style from '../Table.module.scss';

export default function DelayRow(props) {
  const { row } = props;
  const { key, ...restProps } = row.getRowProps();
  return (
    <tr key={key} {...restProps}>
      <td className={style.delayCell}>{`${row.original.duration} delay`}</td>
    </tr>
  );
}
