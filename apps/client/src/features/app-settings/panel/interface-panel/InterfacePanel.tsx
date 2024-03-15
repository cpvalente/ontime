import { Alert } from '@mantine/core';

import * as Panel from '../PanelUtils';

import EditorSettingsForm from './EditorSettingsForm';
import { IoAlertCircleOutline } from '@react-icons/all-files/io5/IoAlertCircleOutline';

export default function InterfacePanel() {
  return (
    <>
      <Panel.Header>Interface</Panel.Header>
      <Panel.Section>
        <Alert color='blue' icon={<IoAlertCircleOutline />}>
            Interface settings
            <br />
            <br />
            These concern settings that are applied to this user in this browser.
            <br />
            It will not affect other users or other browsers.
        </Alert>
      </Panel.Section>
      <EditorSettingsForm />
    </>
  );
}
