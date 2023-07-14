import { IoPlay } from '@react-icons/all-files/io5/IoPlay';

import { useTimer } from '../../../common/hooks/useSocket';
import { formatTime } from '../../../common/utils/time';

import styles from './TimeBlock.module.scss';

export default function TimeBlock() {
  const timer = useTimer();
  const timeNow = formatTime(timer.clock, {
    showSeconds: true,
    format: 'hh:mm:ss a',
  });

  return (
    <div className={styles.TimeBlock}>
      <IoPlay size={17} />
      <div className={styles.clock}>
        <span className={styles.timer}>{timeNow}</span> <span className={styles.timer}>00:10:00</span>
      </div>
    </div>
  );
}
