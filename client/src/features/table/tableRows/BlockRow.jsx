import React from 'react';
import style from '../Table.module.scss';

export default function BlockRow(props) {
  const { row } = props;
  const { key, ...restProps } = row.getRowProps();
  return (
    <tr key={key} {...restProps}>
      <td className={style.blockCell}>Delay Block</td>
    </tr>
  );
}
