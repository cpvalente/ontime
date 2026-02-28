import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import useViewSettings from '../../../common/hooks-query/useViewSettings';
import { useProgressData } from '../../../common/hooks/useSocket';

import styles from './CuesheetProgress.module.scss';

export default function CuesheetProgress() {
  const { data } = useViewSettings();
  const { current, duration, timeWarning, timeDanger } = useProgressData();

  return (
    <MultiPartProgressBar
      now={current}
      complete={duration}
      normalColor={data.normalColor}
      warning={timeWarning}
      warningColor={data.warningColor}
      danger={timeDanger}
      dangerColor={data.dangerColor}
      className={styles.progressOverride}
      ignoreCssOverride
    />
  );
}
