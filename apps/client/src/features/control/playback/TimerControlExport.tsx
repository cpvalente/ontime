import { memo } from 'react';

import ErrorBoundary from '../../../common/components/error-boundary/ErrorBoundary';
import ViewNavigationMenu from '../../../common/components/navigation-menu/ViewNavigationMenu';
import ProtectRoute from '../../../common/components/protect-route/ProtectRoute';
import { handleLinks } from '../../../common/utils/linkUtils';
import { Corner } from '../../editors/editor-utils/EditorUtils';

import PlaybackControl from './PlaybackControl';

import style from '../../editors/Editor.module.scss';

export default memo(TimerControlExport);
function TimerControlExport() {
  const isExtracted = window.location.pathname.includes('/timercontrol');

  return (
    <ProtectRoute permission='editor'>
      <div className={style.playback} data-testid='panel-timer-control'>
        {!isExtracted && <Corner onClick={(event) => handleLinks('timercontrol', event)} />}
        {isExtracted && <ViewNavigationMenu supressSettings />}

        <div className={style.content}>
          <ErrorBoundary>
            <PlaybackControl />
          </ErrorBoundary>
        </div>
      </div>
    </ProtectRoute>
  );
}
