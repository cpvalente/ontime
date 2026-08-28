import { type CSSProperties, type Ref, memo } from 'react';

import { getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatDuration } from '../../../common/utils/time';

import style from './OperatorGroup.module.scss';

interface OperatorGroup {
  title: string;
  colour: string;
  count: number;
  duration: number;
  ref?: Ref<HTMLDivElement>;
}

export default memo(OperatorGroup);
function OperatorGroup({ title, colour, count, duration, ref }: OperatorGroup) {
  const groupColour = colour || '#929292';
  const groupColours = getAccessibleColour(groupColour);

  return (
    <div className={style.group} style={{ ...groupColours, '--group-colour': groupColour } as CSSProperties} ref={ref}>
      <span className={style.title}>{title}</span>
      <span className={style.meta}>
        <span>{`${count} ${count === 1 ? 'event' : 'events'}`}</span>
        <span>{formatDuration(duration)}</span>
      </span>
    </div>
  );
}
