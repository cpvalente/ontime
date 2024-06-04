import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import { useProgressData } from '../../../common/hooks/useSocket';
import useViewSettings from '../../../common/hooks-query/useViewSettings';

import styles from './CuesheetProgress.module.scss';

export default function CuesheetProgress() {
  const { data } = useViewSettings();
  const { addedTime, current, duration, timeWarning, timeDanger } = useProgressData();
  const totalTime = (duration ?? 0) + (addedTime ?? 0);

  return (
    <MultiPartProgressBar
      now={current}
      complete={totalTime}
      normalColor={data!.normalColor}
      warning={timeWarning}
      warningColor={data!.warningColor}
      danger={timeDanger}
      dangerColor={data!.dangerColor}
      className={styles.progressOverride}
      ignoreCssOverride
    />
  );
}
