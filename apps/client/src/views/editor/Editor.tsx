import { lazy } from 'react';

import { RundownScopeProvider } from '../../common/context/RundownScopeContext';
import { cx } from '../../common/utils/styleUtils';
import TrackingPlaybackBar from '../../features/control/playback/tracking-playback-bar/TrackingPlaybackBar';
import { AppMode } from '../../ontimeConfig';
import TitleList from './title-list/TitleList';
import { EditorLayoutMode, useEditorLayout } from './useEditorLayout';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../../features/rundown/RundownExport'));
const TimerControl = lazy(() => import('../../features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../../features/control/message/MessageControlExport'));

interface EditorProps {
  isSettingsOpen: boolean;
}

export default function Editor({ isSettingsOpen }: EditorProps) {
  return (
    // the titles and the rundown share a scope, so they follow one cursor, which survives a layout change
    <RundownScopeProvider rundownId={null}>
      <EditorLayout isSettingsOpen={isSettingsOpen} />
    </RundownScopeProvider>
  );
}

/**
 * The settings replace the editor on screen but keep it mounted, so its state survives them.
 * The panels are hidden in place rather than removed from the layout, see .hidden
 */
function EditorLayout({ isSettingsOpen }: EditorProps) {
  const { layoutMode } = useEditorLayout();
  const hiddenClass = isSettingsOpen && styles.hidden;

  if (layoutMode === EditorLayoutMode.CONTROL) {
    return (
      <div id='panels' className={cx([styles.panelContainer, hiddenClass])} inert={isSettingsOpen}>
        <div className={styles.left}>
          <TimerControl />
          <MessageControl />
        </div>
        <Rundown />
      </div>
    );
  }

  if (layoutMode === EditorLayoutMode.TRACKING) {
    return (
      <div
        id='panels'
        className={cx([styles.panelContainer, styles.panelContainerTracking, hiddenClass])}
        inert={isSettingsOpen}
      >
        <div className={styles.rundownLayout}>
          <div className={styles.titlesPanel}>
            <TitleList mode={AppMode.Run} />
          </div>
          <div className={styles.rundownPanel}>
            <Rundown />
          </div>
        </div>
        <TrackingPlaybackBar />
      </div>
    );
  }

  return (
    <div id='panels' className={cx([styles.panelContainer, hiddenClass])} inert={isSettingsOpen}>
      <div className={styles.rundownLayout}>
        <div className={styles.titlesPanel}>
          <TitleList mode={AppMode.Edit} />
        </div>
        <div className={styles.rundownPanel}>
          <Rundown />
        </div>
      </div>
    </div>
  );
}
