import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import { useTimer } from '../../../common/hooks/useSocket';
import useViewSettings from '../../../common/hooks-query/useViewSettings';

import styles from './CuesheetProgress.module.scss';

export default function CuesheetProgress() {
  const { data } = useViewSettings();
  const timer = useTimer();
  const totalTime = (timer.duration ?? 0) + (timer.addedTime ?? 0);

  return (
    <MultiPartProgressBar
      now={timer.current}
      complete={totalTime}
      normalColor={data!.normalColor}
      warning={timer.timeWarning}
      warningColor={data!.warningColor}
      danger={timer.timeDanger}
      dangerColor={data!.dangerColor}
      className={styles.progressOverride}
    />
  );
}
