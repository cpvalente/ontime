import useRundown from '../../../common/hooks-query/useRundown';

import { getTimelineSections } from './timelineUtils';

import style from './TimelineMarkers.module.scss';

export function TimelineMarkers() {
  const { data } = useRundown();

  if (data.revision === -1) {
    return null;
  }

  const elements = getTimelineSections(data.rundown, data.order);

  return (
    <div className={style.markers}>
      {elements.map((tag, index) => {
        return <span key={index}>{tag}</span>;
      })}
    </div>
  );
}
