import React from 'react';
import style from '../Table.module.scss';
import { millisToMinutes } from '../../../common/utils/dateConfig';

export default function DelayRow(props) {
  const { row } = props;
  const delayVal = row.original.duration;
  const minutesDelayed = Math.abs(millisToMinutes(delayVal));
  const labelText = `${minutesDelayed} minutes ${delayVal >= 0 ? 'delayed' : 'ahead'}`;

  return (
    <tr {...row.getRowProps()}>
      <td className={style.delayCell}>{labelText}</td>
    </tr>
  );
}
