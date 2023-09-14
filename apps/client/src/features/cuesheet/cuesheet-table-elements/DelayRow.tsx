import { memo } from 'react';

import { millisToDelayString } from '../../../common/utils/dateConfig';

import style from '../Cuesheet.module.scss';

interface DelayRowProps {
  duration: number;
}

function DelayRow(props: DelayRowProps) {
  const { duration } = props;
  const delayTime = millisToDelayString(duration);

  return (
    <tr className={style.delayRow}>
      <td>{delayTime}</td>
    </tr>
  );
}

export default memo(DelayRow);
