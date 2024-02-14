import * as Panel from '../PanelUtils';

import GeneralPanelForm from './GeneralPanelForm';

export default function GeneralPanel() {
  return (
    <>
      <Panel.Header>General</Panel.Header>
      <Panel.Section>
        <Panel.SubHeader>App</Panel.SubHeader>
        <Panel.Card>
          <GeneralPanelForm action='create' submitError='' />
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
