import { millisToDelayString } from '../../../common/utils/dateConfig';

import style from '../Table.module.scss';

interface DelayRowProps {
  row: any;
}

export default function DelayRow(props: DelayRowProps) {
  const { row } = props;
  const delayVal = row.original.duration;
  const delayTime = delayVal !== 0 ? millisToDelayString(delayVal) : null;

  return (
    <tr {...row.getRowProps()}>
      <td className={style.delayCell}>{delayTime}</td>
    </tr>
  );
}
