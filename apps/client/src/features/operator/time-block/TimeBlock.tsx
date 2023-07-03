import styles from './TimeBlock.module.scss';
import { FiPlay } from '@react-icons/all-files/fi/FiPlay';
import { useTimer } from '../../../common/hooks/useSocket';
import { formatTime } from '../../../common/utils/time';

type Props = {};

export default function TimeBlock({}: Props) {
  const timer = useTimer();
  const timeNow = formatTime(timer.clock, {
    showSeconds: true,
    format: 'hh:mm:ss a',
  });
  return (
    <div className={styles.block}>
      <FiPlay size={17} />
      <div className={styles.clock}>
        {timeNow} <div>00:10:00</div>
      </div>
    </div>
  );
}
