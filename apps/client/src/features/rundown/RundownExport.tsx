import { memo } from 'react';
import { useSessionStorage } from '@mantine/hooks';

import { Corner } from '../../common/components/editor-utils/EditorUtils';
import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import ViewNavigationMenu from '../../common/components/navigation-menu/ViewNavigationMenu';
import ProtectRoute from '../../common/components/protect-route/ProtectRoute';
import { useIsSmallDevice } from '../../common/hooks/useIsSmallDevice';
import { handleLinks } from '../../common/utils/linkUtils';
import { cx } from '../../common/utils/styleUtils';
import { AppMode, sessionKeys } from '../../ontimeConfig';

import RundownEntryEditor from './entry-editor/RundownEntryEditor';
import FinderPlacement from './placements/FinderPlacement';
import { RundownContextMenu } from './rundown-context-menu/RundownContextMenu';
import RundownWrapper from './RundownWrapper';

import style from './RundownExport.module.scss';

export default memo(RundownExport);

function RundownExport() {
  const isExtracted = window.location.pathname.includes('/rundown');
  const [editorMode] = useSessionStorage({
    key: sessionKeys.editorMode,
    defaultValue: AppMode.Edit,
  });
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
          <ViewNavigationMenu suppressSettings />
          <div className={style.content}>
            <ErrorBoundary>
              <RundownContextMenu>
                <RundownWrapper isSmallDevice />
              </RundownContextMenu>
            </ErrorBoundary>
          </div>
        </div>
      </ProtectRoute>
    );
  }

  const hideSideBar = isExtracted && editorMode === 'run';

  return (
    <ProtectRoute permission='editor'>
      <div className={cx([style.rundownExport, isExtracted && style.extracted])} data-testid='panel-rundown'>
        <FinderPlacement />
        <div className={style.rundown}>
          <div className={style.list}>
            <ErrorBoundary>
              <Corner onClick={(event) => handleLinks('rundown', event)} />
              <RundownContextMenu>
                <RundownWrapper />
              </RundownContextMenu>
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
