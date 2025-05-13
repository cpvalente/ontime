import { memo } from 'react';

import ErrorBoundary from '../../../common/components/error-boundary/ErrorBoundary';

import style from '../../editors/Editor.module.scss';
import PlaybackControl from './PlaybackControl';

const MobileTimerControlExport = () => {
  return (
    <div className={style.playback} data-testid='panel-timer-control'>
      <div className={style.content}>
        <ErrorBoundary>
          <PlaybackControl />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default memo(MobileTimerControlExport);
