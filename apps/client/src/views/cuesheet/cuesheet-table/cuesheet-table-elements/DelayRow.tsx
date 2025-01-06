import { memo } from 'react';

import { millisToDelayString } from '../../../../common/utils/dateConfig';

import style from '../CuesheetTable.module.scss';

interface DelayRowProps {
  duration: number;
}

function DelayRow(props: DelayRowProps) {
  const { duration } = props;
  const delayTime = millisToDelayString(duration, 'expanded');

  return (
    <tr className={style.delayRow}>
      <td>{delayTime}</td>
    </tr>
  );
}

export default memo(DelayRow);
