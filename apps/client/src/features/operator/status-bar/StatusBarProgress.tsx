import { ViewSettings } from 'ontime-types';

import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import { useProgressData } from '../../../common/hooks/useSocket';

import styles from './StatusBar.module.scss';

interface StatusBarProgressProps {
  viewSettings: ViewSettings;
}

export default function StatusBarProgress(props: StatusBarProgressProps) {
  const { viewSettings } = props;
  const { addedTime, current, duration, timeWarning, timeDanger } = useProgressData();
  const totalTime = (duration ?? 0) + (addedTime ?? 0);

  return (
    <MultiPartProgressBar
      now={current}
      complete={totalTime}
      normalColor={viewSettings.normalColor}
      warning={timeWarning}
      warningColor={viewSettings.warningColor}
      danger={timeDanger}
      dangerColor={viewSettings.dangerColor}
      className={styles.progressOverride}
      ignoreCssOverride
    />
  );
}
