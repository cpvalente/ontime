import { clamp } from '../../../app/utils';
import styles from './MyProgressBar.module.css';

export default function MyProgressBar(props) {
  const { now, complete, showElapsed } = props;
  const percentComplete = showElapsed
  ? clamp((100 - (now * 100) / complete), 0, 100)
  : clamp((now * 100) / complete, 0, 100)

  return (
    <div className={styles.progress}>
      <div
        className={styles.progressBar}
        style={{ width: `${percentComplete}%` }}
      ></div>
    </div>
  );
}
