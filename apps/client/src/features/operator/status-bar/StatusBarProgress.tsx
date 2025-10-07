import { ViewSettings } from 'ontime-types';

import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import { useProgressData } from '../../../common/hooks/useSocket';

import styles from './StatusBar.module.scss';

interface StatusBarProgressProps {
  viewSettings: ViewSettings;
}

export default function StatusBarProgress({ viewSettings }: StatusBarProgressProps) {
  const { current, duration, timeWarning, timeDanger } = useProgressData();

  return (
    <MultiPartProgressBar
      now={current}
      complete={duration}
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
