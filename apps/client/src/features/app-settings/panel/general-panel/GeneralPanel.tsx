import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import EditorSettingsForm from '../interface-panel/EditorSettingsForm';

import GeneralPanelForm from './GeneralPanelForm';
import ViewSettingsForm from './ViewSettingsForm';

export default function GeneralPanel({ location }: PanelBaseProps) {
  const generalRef = useScrollIntoView<HTMLDivElement>('settings', location);
  const editorRef = useScrollIntoView<HTMLDivElement>('editor', location);
  const viewRef = useScrollIntoView<HTMLDivElement>('view', location);

  return (
    <>
      <Panel.Header>App Settings</Panel.Header>
      <div ref={generalRef}>
        <GeneralPanelForm />
      </div>
      <div ref={editorRef}>
        <EditorSettingsForm />
      </div>
      <div ref={viewRef}>
        <ViewSettingsForm />
      </div>
    </>
  );
}
