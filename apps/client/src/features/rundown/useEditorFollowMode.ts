import { useSessionStorage } from '@mantine/hooks';

import { AppMode, sessionKeys } from '../../ontimeConfig';
import { EditorLayoutMode, useEditorLayout } from '../../views/editor/useEditorLayout';

/**
 * Manages the editor mode (Edit/Run) derived from layout mode
 *
 * Editor mode is automatically determined by the layout:
 * - PLANNING: Always Edit mode (follows user selection)
 * - TRACKING: Always Run mode (follows current event)
 * - CONTROL: User preference (defaults to Run mode), persisted in session storage
 *
 * Edit: Manual editing, follows user selection
 * Run: Live playback view, auto-follows current event
 */
export function useEditorFollowMode() {
  const { layoutMode } = useEditorLayout();

  // Only used for CONTROL layout - stores user preference
  const [controlModePreference, setControlModePreference] = useSessionStorage<AppMode>({
    key: sessionKeys.editorMode,
    defaultValue: AppMode.Run,
  });

  // Derive editor mode from layout mode
  const editorMode = (() => {
    if (layoutMode === EditorLayoutMode.CONTROL) return controlModePreference;
    if (layoutMode === EditorLayoutMode.PLANNING) return AppMode.Edit;
    return AppMode.Run;
  })();

  // setEditorMode only affects CONTROL layout
  const setEditorMode = (mode: AppMode) => {
    if (layoutMode === EditorLayoutMode.CONTROL) {
      setControlModePreference(mode);
    }
  };

  return { editorMode, setEditorMode };
}
