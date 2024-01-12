import { Tooltip } from '@chakra-ui/react';

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
          <Tooltip label='Planned start'>
            <div className={styles.start}>Planned start</div>
          </Tooltip>
          <Tooltip label='Actual start'>
            <div className={styles.start}>Actual start</div>
          </Tooltip>
        </div>
        <RuntimeOverview />
        <div className={styles.clocks}>
          <Tooltip label='Planned end'>
            <div className={styles.end}>Planned end</div>
          </Tooltip>
          <Tooltip label='Expected end'>
            <div className={styles.end}>Expected end</div>
          </Tooltip>
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

  const display = formatTime(clock);

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
