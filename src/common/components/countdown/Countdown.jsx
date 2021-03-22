import styles from './Countdown.module.css'

export default function Countdown({ time }) {
  return <div className={styles.countdownClock}>{time}</div>;
}
