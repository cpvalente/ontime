import React from 'react';
import style from '../Table.module.scss';

export default function BlockRow(props) {
  const { row } = props;
  return (
    <tr {...row.getRowProps()}>
      <td className={style.blockCell}>Delay Block</td>
    </tr>
  );
}
