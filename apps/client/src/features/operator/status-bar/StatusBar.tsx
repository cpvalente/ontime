import { Playback } from 'ontime-types';

import useViewSettings from '../../../common/hooks-query/useViewSettings';

import StatusBarProgress from './StatusBarProgress';
import StatusBarTimers from './StatusBarTimers';

import styles from './StatusBar.module.scss';

interface StatusBarProps {
  projectTitle: string;
  playback: Playback;
  selectedEventId: string | null;
  firstStart?: number;
  firstId?: string;
  lastEnd?: number;
  lastId?: string;
}

export default function StatusBar(props: StatusBarProps) {
  const { projectTitle, playback, selectedEventId, firstStart, firstId, lastEnd, lastId } = props;

  const { data } = useViewSettings();

  return (
    <div className={styles.statusBar}>
      <StatusBarTimers
        projectTitle={projectTitle}
        playback={playback}
        selectedEventId={selectedEventId}
        firstStart={firstStart}
        firstId={firstId}
        lastEnd={lastEnd}
        lastId={lastId}
      />
      {data && <StatusBarProgress viewSettings={data} />}
    </div>
  );
}
