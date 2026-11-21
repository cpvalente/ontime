import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import { useProgressData } from '../../../common/hooks/useSocket';

import styles from './CuesheetProgress.module.scss';

export default function CuesheetProgress() {
  const { current, duration, eventId, timeWarning, timeDanger } = useProgressData();

  return (
    <MultiPartProgressBar
      now={current}
      complete={duration}
      eventId={eventId}
      warning={timeWarning}
      danger={timeDanger}
      className={styles.progressOverride}
      ignoreCssOverride
    />
  );
}
