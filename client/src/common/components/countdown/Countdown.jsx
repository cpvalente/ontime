import styles from './Countdown.module.css';

function display(seconds) {
  const format = (val) => `0${Math.floor(val)}`.slice(-2);
  const hours = seconds / 3600;
  const minutes = (seconds % 3600) / 60;

  return [hours, minutes, seconds % 60].map(format).join(':');
}

export default function Countdown({ time, small }) {
  return (
    <div className={small ? styles.countdownClockSmall : styles.countdownClock}>
      {(time === null || isNaN(time)) ? '-- : -- : --' : display(time)}
    </div>
  );
}
