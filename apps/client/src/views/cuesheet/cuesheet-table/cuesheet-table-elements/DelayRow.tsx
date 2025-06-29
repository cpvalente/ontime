import { memo } from 'react';

import { millisToDelayString } from '../../../../common/utils/dateConfig';

import style from './DelayRow.module.scss';

interface DelayRowProps {
  duration: number;
  parentBgColour: string | null;
}

function DelayRow({ duration, parentBgColour }: DelayRowProps) {
  const delayTime = millisToDelayString(duration, 'expanded');

  return (
    <tr
      className={style.delayRow}
      style={{
        '--user-bg': parentBgColour ?? 'transparent',
      }}
    >
      <td tabIndex={0} role='cell'>
        {delayTime}
      </td>
    </tr>
  );
}

export default memo(DelayRow);
