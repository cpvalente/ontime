import { makeTimelineSections } from '../timeline.utils';

import style from './TimelineMarkers.module.scss';

interface TimelineMarkersProps {
  startHour: number;
  endHour: number;
}

export default function TimelineMarkers(props: TimelineMarkersProps) {
  const { startHour, endHour } = props;

  const elements = makeTimelineSections(startHour, endHour);

  return (
    <div className={style.markers}>
      {elements.map((tag, index) => {
        return <span key={`${index}-${tag}`}>{tag}</span>;
      })}
    </div>
  );
}
