import useRundown from '../../../../common/hooks-query/useRundown';
import { getTimelineSections } from '../timeline.utils';

import style from './TimelineMarkers.module.scss';

export default function TimelineMarkers() {
  const { data } = useRundown();

  if (!data || data.revision === -1) {
    return null;
  }

  const elements = getTimelineSections(data.rundown, data.order);

  return (
    <div className={style.markers}>
      {elements.map((tag) => {
        return <span key={tag}>{tag}</span>;
      })}
    </div>
  );
}
