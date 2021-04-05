import { clamp } from '../../../app/utils';
import styles from './MyProgressBar.module.css';

export default function MyProgressBar({ normalisedComplete }) {
  const percentComplete = clamp(100 - normalisedComplete * 100, 0, 100);
  const completeWidth = `${percentComplete}%`;

  return (
    <div className={styles.progress}>
      <div
        className={styles.progressBar}
        style={{ width: completeWidth }}
      ></div>
    </div>
  );
}
