import { memo } from 'react';

import { Corner } from '../../../common/components/editor-utils/EditorUtils';
import ErrorBoundary from '../../../common/components/error-boundary/ErrorBoundary';
import ViewNavigationMenu from '../../../common/components/navigation-menu/ViewNavigationMenu';
import ProtectRoute from '../../../common/components/protect-route/ProtectRoute';
import { handleLinks } from '../../../common/utils/linkUtils';
import { getIsNavigationLocked } from '../../../externals';

import PlaybackControl from './PlaybackControl';

import style from '../../../views/editor/Editor.module.scss';

export default memo(TimerControlExport);
function TimerControlExport() {
  const isExtracted = window.location.pathname.includes('/timercontrol');
  const isLocked = getIsNavigationLocked();

  return (
    <ProtectRoute permission='editor'>
      <div className={style.playback} data-testid='panel-timer-control'>
        {!isExtracted && <Corner onClick={(event) => handleLinks('timercontrol', event)} />}
        {(isExtracted || isLocked) && <ViewNavigationMenu suppressSettings={isExtracted} isNavigationLocked={isLocked} />}

        <div className={style.content}>
          <ErrorBoundary>
            <PlaybackControl />
          </ErrorBoundary>
        </div>
      </div>
    </ProtectRoute>
  );
}
