import styles from './MyProgressBar.module.css';

const clamp = (num, a, b) =>
  Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));

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
