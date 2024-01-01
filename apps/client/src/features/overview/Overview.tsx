import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import PlaybackIcon from '../../common/components/playback-icon/PlaybackIcon';
import { useRuntimeOverview } from '../../common/hooks/useSocket';
import useProjectData from '../../common/hooks-query/useProjectData';
import { formatTime } from '../../common/utils/time';

import styles from './Overview.module.scss';

export default function Overview() {
  return (
    <div className={styles.overview}>
      <ErrorBoundary>
        <TitlesOverview />
        <div className={styles.clocks}>
          <div>
            <span className={styles.start} />
            Planned start
          </div>
          <div>
            <span className={styles.start} />
            Actual start
          </div>
        </div>
        <RuntimeOverview />
        <div className={styles.clocks}>
          <div>
            <span className={styles.end} />
            Planned end
          </div>
          <div>
            <span className={styles.end} />
            Expected end
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}

function TitlesOverview() {
  const { data } = useProjectData();

  return (
    <div className={styles.titles}>
      <div className={styles.title}>{data.title}</div>
      <div className={styles.description}>{data.description}</div>
    </div>
  );
}

function RuntimeOverview() {
  const { playback, clock, numEvents, selectedEventIndex } = useRuntimeOverview();

  const current = selectedEventIndex !== null ? selectedEventIndex + 1 : '-';
  const ofTotal = numEvents || '-';

  const display = formatTime(clock, {
    showSeconds: true,
  });

  return (
    <div className={styles.clocks}>
      <div className={styles.inline}>
        <PlaybackIcon state={playback} skipTooltip />
        {display}
      </div>
      <div className={styles.inline}>
        <span>{`(${current} / ${ofTotal})`}</span>
        Over / Under
      </div>
    </div>
  );
}
