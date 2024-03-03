import * as Panel from '../PanelUtils';

import EditorSettingsForm from './EditorSettingsForm';
import GeneralPanelForm from './GeneralPanelForm';
import ViewSettingsForm from './ViewSettingsForm';

export default function GeneralPanel() {
  return (
    <>
      <Panel.Header>Settings</Panel.Header>
      <GeneralPanelForm />
      <EditorSettingsForm />
      <ViewSettingsForm />
    </>
  );
}
