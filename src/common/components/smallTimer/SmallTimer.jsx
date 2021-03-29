import styles from './SmallTimer.module.css';

export default function SmallTimer({ label, time }) {
  return (
    <div className={styles.SmallTimer}>
      <div className={styles.label}>{label}</div>
      <div className={styles.timer}>{time}</div>
    </div>
  );
}
