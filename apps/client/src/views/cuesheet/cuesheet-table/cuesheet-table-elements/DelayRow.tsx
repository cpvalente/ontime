import { CSSProperties, memo } from 'react';

import { millisToDelayString } from '../../../../common/utils/dateConfig';
import { usePersistedCuesheetOptions } from '../../cuesheet.options';

import style from './DelayRow.module.scss';

interface DelayRowProps {
  duration: number;
  injectedStyles?: CSSProperties;
}

function DelayRow({ duration, injectedStyles, ...virtuosoProps }: DelayRowProps) {
  const hideDelays = usePersistedCuesheetOptions((state) => state.hideDelays);

  if (hideDelays || duration === 0) {
    return null;
  }

  const delayTime = millisToDelayString(duration, 'expanded');

  return (
    <tr className={style.delayRow} data-testid='cuesheet-delay' style={injectedStyles} {...virtuosoProps}>
      <td tabIndex={0}>{delayTime}</td>
    </tr>
  );
}

export default memo(DelayRow);
