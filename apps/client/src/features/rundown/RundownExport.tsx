import { memo } from 'react';

import { ContextMenu } from '../../common/components/context-menu/ContextMenu';
import { Corner } from '../../common/components/editor-utils/EditorUtils';
import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import ViewNavigationMenu from '../../common/components/navigation-menu/ViewNavigationMenu';
import ProtectRoute from '../../common/components/protect-route/ProtectRoute';
import { useIsSmallDevice } from '../../common/hooks/useIsSmallDevice';
import { useAppMode } from '../../common/stores/appModeStore';
import { handleLinks } from '../../common/utils/linkUtils';
import { cx } from '../../common/utils/styleUtils';

import RundownEntryEditor from './entry-editor/RundownEntryEditor';
import FinderPlacement from './placements/FinderPlacement';
import RundownWrapper from './RundownWrapper';

import style from './RundownExport.module.scss';

export default memo(RundownExport);

function RundownExport() {
  const isExtracted = window.location.pathname.includes('/rundown');
  const appMode = useAppMode((state) => state.mode);
  const isSmallDevice = useIsSmallDevice();

  if (isSmallDevice && isExtracted) {
    return (
      <ProtectRoute permission='editor'>
        <div
          className={cx([style.rundownExport, style.extracted])}
          data-target='small-device'
          data-testid='panel-rundown'
        >
          <FinderPlacement />
          <ViewNavigationMenu supressSettings />
          <div className={style.content}>
            <ErrorBoundary>
              <ContextMenu>
                <RundownWrapper isSmallDevice />
              </ContextMenu>
            </ErrorBoundary>
          </div>
        </div>
      </ProtectRoute>
    );
  }

  const hideSideBar = isExtracted && appMode === 'run';

  return (
    <ProtectRoute permission='editor'>
      <div className={cx([style.rundownExport, isExtracted && style.extracted])} data-testid='panel-rundown'>
        <FinderPlacement />
        <div className={style.rundown}>
          <div className={style.list}>
            <ErrorBoundary>
              <Corner onClick={(event) => handleLinks('rundown', event)} />
              <ContextMenu>
                <RundownWrapper />
              </ContextMenu>
            </ErrorBoundary>
          </div>
          {!hideSideBar && (
            <div className={style.side}>
              <ErrorBoundary>
                <RundownEntryEditor />
              </ErrorBoundary>
            </div>
          )}
        </div>
      </div>
    </ProtectRoute>
  );
}
