import * as Panel from '../PanelUtils';

import GeneralPanelForm from './GeneralPanelForm';
import ViewSettingsForm from './ViewSettingsForm';

export default function GeneralPanel() {
  return (
    <>
      <Panel.Header>Settings</Panel.Header>
      <GeneralPanelForm />
      <ViewSettingsForm />
    </>
  );
}
