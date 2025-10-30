import { memo } from 'react';

import { Corner } from '../../../common/components/editor-utils/EditorUtils';
import ErrorBoundary from '../../../common/components/error-boundary/ErrorBoundary';
import ViewNavigationMenu from '../../../common/components/navigation-menu/ViewNavigationMenu';
import ProtectRoute from '../../../common/components/protect-route/ProtectRoute';
import { handleLinks } from '../../../common/utils/linkUtils';
import { cx } from '../../../common/utils/styleUtils';
import { getIsNavigationLocked } from '../../../externals';

import MessageControl from './MessageControl';

import style from '../../../views/editor/Editor.module.scss';

export default memo(MessageControlExport);
function MessageControlExport() {
  const isExtracted = window.location.pathname.includes('/messagecontrol');
  const isLocked = getIsNavigationLocked();
  const classes = cx([style.content, style.contentColumnLayout]);

  return (
    <ProtectRoute permission='editor'>
      <div className={style.messages} data-testid='panel-messages-control'>
        {!isExtracted && <Corner onClick={(event) => handleLinks('messagecontrol', event)} />}
        {(isExtracted || isLocked) && <ViewNavigationMenu suppressSettings={isExtracted} isNavigationLocked={isLocked} />}

        <div className={classes}>
          <ErrorBoundary>
            <MessageControl />
          </ErrorBoundary>
        </div>
      </div>
    </ProtectRoute>
  );
}
