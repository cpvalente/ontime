import { makeTimelineSections } from '../timeline.utils';

import style from './TimelineMarkers.module.scss';

interface TimelineMarkersProps {
  startHour: number;
  endHour: number;
}

/** Creates a line for every hour in the timeline */
export default function TimelineMarkers(props: TimelineMarkersProps) {
  const { startHour, endHour } = props;

  const elements = makeTimelineSections(startHour, endHour);

  return (
    <div className={style.markers}>
      {elements.map((tag) => (
        <span key={tag} />
      ))}
    </div>
  );
}
