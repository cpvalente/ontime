import { lazy } from 'react';

import { RundownScopeProvider } from '../../common/context/RundownScopeContext';
import TrackingPlaybackBar from '../../features/control/playback/tracking-playback-bar/TrackingPlaybackBar';
import { AppMode } from '../../ontimeConfig';
import TitleList from './title-list/TitleList';
import { EditorLayoutMode, useEditorLayout } from './useEditorLayout';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../../features/rundown/RundownExport'));
const TimerControl = lazy(() => import('../../features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../../features/control/message/MessageControlExport'));

export default function Editor() {
  const { layoutMode } = useEditorLayout();

  if (layoutMode === EditorLayoutMode.CONTROL) {
    return (
      <div id='panels' className={styles.panelContainer}>
        <div className={styles.left}>
          <TimerControl />
          <MessageControl />
        </div>
        <RundownScopeProvider rundownId={null}>
          <Rundown />
        </RundownScopeProvider>
      </div>
    );
  }

  if (layoutMode === EditorLayoutMode.TRACKING) {
    return (
      <div id='panels' className={`${styles.panelContainer} ${styles.panelContainerTracking}`}>
        {/* the titles and the rundown share a scope, so they follow one cursor */}
        <RundownScopeProvider rundownId={null}>
          <div className={styles.rundownLayout}>
            <div className={styles.titlesPanel}>
              <TitleList mode={AppMode.Run} />
            </div>
            <div className={styles.rundownPanel}>
              <Rundown />
            </div>
          </div>
        </RundownScopeProvider>
        <TrackingPlaybackBar />
      </div>
    );
  }

  return (
    <div id='panels' className={styles.panelContainer}>
      <RundownScopeProvider rundownId={null}>
        <div className={styles.rundownLayout}>
          <div className={styles.titlesPanel}>
            <TitleList mode={AppMode.Edit} />
          </div>
          <div className={styles.rundownPanel}>
            <Rundown />
          </div>
        </div>
      </RundownScopeProvider>
    </div>
  );
}
