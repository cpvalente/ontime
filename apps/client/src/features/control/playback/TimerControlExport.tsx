import { memo } from 'react';

import ErrorBoundary from '../../../common/components/error-boundary/ErrorBoundary';
import { handleLinks } from '../../../common/utils/linkUtils';
import { Corner } from '../../editors/editor-utils/EditorUtils';

import PlaybackControl from './PlaybackControl';

import style from '../../editors/Editor.module.scss';

const TimerControlExport = () => {
  const isExtracted = window.location.pathname.includes('/timercontrol');
  return (
    <div className={style.playback} data-testid='panel-timer-control'>
      {!isExtracted && <Corner onClick={(event) => handleLinks('timercontrol', event)} />}
      <div className={style.content}>
        <ErrorBoundary>
          <PlaybackControl />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default memo(TimerControlExport);
