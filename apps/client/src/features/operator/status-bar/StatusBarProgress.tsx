import { ViewSettings } from 'ontime-types';

import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import { useTimer } from '../../../common/hooks/useSocket';

import styles from './StatusBar.module.scss';

interface StatusBarProgressProps {
  viewSettings: ViewSettings;
}

export default function StatusBarProgress(props: StatusBarProgressProps) {
  const { viewSettings } = props;

  const timer = useTimer();
  const totalTime = (timer.duration ?? 0) + (timer.addedTime ?? 0);

  return (
    <MultiPartProgressBar
      now={timer.current}
      complete={totalTime}
      normalColor={viewSettings.normalColor}
      warning={timer.timeWarning || 0}
      warningColor={viewSettings.warningColor}
      danger={timer.timeDanger || 0}
      dangerColor={viewSettings.dangerColor}
      className={styles.progressOverride}
    />
  );
}
