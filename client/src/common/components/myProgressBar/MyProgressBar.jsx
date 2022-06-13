import React from 'react';
import { clamp } from 'app/utils/math';
import PropTypes from 'prop-types';

import styles from './MyProgressBar.module.scss';

export default function MyProgressBar(props) {
  const { now, complete, showElapsed } = props;

  let percentComplete = showElapsed ? 0 : 100;

  if (now != null && complete != null) {
    percentComplete = showElapsed
      ? clamp(100 - (now * 100) / complete, 0, 100)
      : clamp((now * 100) / complete, 0, 100);
  }

  return (
    <div className={showElapsed ? styles.progress : styles.progressCountdown}>
      <div
        className={styles.progressBar}
        style={{ width: `${percentComplete}%` }}
      />
    </div>
  );
}

MyProgressBar.propTypes = {
  now: PropTypes.number,
  complete: PropTypes.number,
  showElapsed: PropTypes.bool,
}
