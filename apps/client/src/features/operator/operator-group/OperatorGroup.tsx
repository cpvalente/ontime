import { type CSSProperties, type Ref, memo } from 'react';

import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatDuration } from '../../../common/utils/time';

import style from './OperatorGroup.module.scss';

interface OperatorGroup {
  title: string;
  colour: string;
  count: number;
  duration: number;
  isLive: boolean;
  ref?: Ref<HTMLDivElement>;
}

export default memo(OperatorGroup);
function OperatorGroup({ title, colour, count, duration, isLive, ref }: OperatorGroup) {
  const groupColour = colour || '#929292';
  const groupColours = getAccessibleColour(groupColour);

  return (
    <div
      className={cx([style.group, isLive && style.live])}
      style={{ ...groupColours, '--group-colour': groupColour } as CSSProperties}
      ref={ref}
    >
      <span className={style.title}>{title}</span>
      <span className={style.meta}>
        <span>{`${count} ${count === 1 ? 'event' : 'events'}`}</span>
        <span>{formatDuration(duration)}</span>
      </span>
    </div>
  );
}
