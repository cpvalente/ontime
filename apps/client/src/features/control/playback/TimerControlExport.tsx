import { memo } from 'react';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';

import ErrorBoundary from '../../../common/components/error-boundary/ErrorBoundary';
import { handleLinks } from '../../../common/utils/linkUtils';

import PlaybackControl from './PlaybackControl';

import style from '../../editors/Editor.module.scss';

const TimerControlExport = () => {
  return (
    <div className={style.playback} data-testid='panel-timer-control'>
      <IoArrowUp className={style.corner} onClick={(event) => handleLinks(event, 'timercontrol')} />
      <div className={style.content}>
        <ErrorBoundary>
          <PlaybackControl />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default memo(TimerControlExport);
