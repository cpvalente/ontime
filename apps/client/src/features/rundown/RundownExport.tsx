import { memo } from 'react';
import { useSessionStorage } from '@mantine/hooks';

import * as Editor from '../../common/components/editor-utils/EditorUtils';
import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import ViewNavigationMenu from '../../common/components/navigation-menu/ViewNavigationMenu';
import ProtectRoute from '../../common/components/protect-route/ProtectRoute';
import { EntryActionsProvider } from '../../common/context/EntryActionsContext';
import { useEntryActions } from '../../common/hooks/useEntryAction';
import { useIsSmallDevice } from '../../common/hooks/useIsSmallDevice';
import { handleLinks } from '../../common/utils/linkUtils';
import { cx } from '../../common/utils/styleUtils';
import { getIsNavigationLocked } from '../../externals';
import { AppMode, sessionKeys } from '../../ontimeConfig';
import EditorEditModal from '../../views/cuesheet/cuesheet-edit-modal/EditorEditModal';

import RundownEntryEditor from './entry-editor/RundownEntryEditor';
import FinderPlacement from './placements/FinderPlacement';
import { RundownContextMenu } from './rundown-context-menu/RundownContextMenu';
import RundownHeader from './rundown-header/RundownHeader';
import RundownHeaderMobile from './rundown-header/RundownHeaderMobile';
import RundownTable from './rundown-table/RundownTable';
import RundownList from './RundownList';
import { DEFAULT_RUNDOWN_VIEW_MODE, RUNDOWN_VIEW_MODE_STORAGE_KEY, RundownViewMode } from './rundownViewMode';

import style from './RundownExport.module.scss';

export default memo(RundownExport);

function RundownExport() {
  const isExtracted = window.location.pathname.includes('/rundown');
  const [editorMode] = useSessionStorage({
    key: sessionKeys.editorMode,
    defaultValue: AppMode.Edit,
  });
  const [viewMode, setViewMode] = useSessionStorage<RundownViewMode>({
    key: RUNDOWN_VIEW_MODE_STORAGE_KEY,
    defaultValue: DEFAULT_RUNDOWN_VIEW_MODE,
  });
  const isSmallDevice = useIsSmallDevice();
  const entryActions = useEntryActions();

  if (isSmallDevice && isExtracted) {
    return (
      <EntryActionsProvider actions={entryActions}>
        <ProtectRoute permission='editor'>
          <div
            className={cx([style.rundownExport, style.extracted])}
            data-target='small-device'
            data-testid='panel-rundown'
          >
            <FinderPlacement />
            <ViewNavigationMenu suppressSettings />
            <div className={style.rundown}>
              <ErrorBoundary>
                <RundownRoot isSmallDevice viewMode={viewMode} setViewMode={setViewMode} />
                <RundownContextMenu />
              </ErrorBoundary>
            </div>
          </div>
        </ProtectRoute>
      </EntryActionsProvider>
    );
  }

  const hideSideBar = (isExtracted && editorMode === 'run') || viewMode === 'table';

  return (
    <EntryActionsProvider actions={entryActions}>
      <ProtectRoute permission='editor'>
        <div className={cx([style.rundownExport, isExtracted && style.extracted])} data-testid='panel-rundown'>
          <FinderPlacement />
          {isExtracted && <ViewNavigationMenu suppressSettings isNavigationLocked={getIsNavigationLocked()} />}
          <div className={style.rundown}>
            <Editor.Panel className={style.list}>
              <ErrorBoundary>
                {!isExtracted && <Editor.CornerExtract onClick={(event) => handleLinks('rundown', event)} />}
                <RundownRoot viewMode={viewMode} setViewMode={setViewMode} />
                <RundownContextMenu />
              </ErrorBoundary>
            </Editor.Panel>
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
    </EntryActionsProvider>
  );
}

interface RundownRootProps {
  isSmallDevice?: boolean;
  viewMode: RundownViewMode;
  setViewMode: (mode: RundownViewMode) => void;
}

function RundownRoot({ isSmallDevice, viewMode, setViewMode }: RundownRootProps) {
  return (
    <div className={style.rundownRoot}>
      {isSmallDevice ? <RundownHeaderMobile /> : <RundownHeader viewMode={viewMode} setViewMode={setViewMode} />}
      {viewMode === 'list' ? <RundownList /> : <RundownTable />}
      <EditorEditModal />
    </div>
  );
}
