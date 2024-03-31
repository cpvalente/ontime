import { Button } from '@chakra-ui/react';

import useElectronEvent from '../../../../common/hooks/useElectronEvent';
import * as Panel from '../PanelUtils';

export default function ShutdownPanel() {
  const { isElectron, sendToElectron } = useElectronEvent();

  const sendShutdown = () => {
    sendToElectron('shutdown', 'now');
  };

  return (
    <>
      <Panel.Header>Shutdown Ontime</Panel.Header>
      <Panel.Section>
        <Panel.Paragraph>
          This will shutdown the Ontime server. <br />
          The runtime state will be lost, but your project is kept for next time.
        </Panel.Paragraph>
        <Button colorScheme='red' onClick={sendShutdown} isDisabled={!isElectron}>
          Shutdown ontime
        </Button>
      </Panel.Section>
    </>
  );
}
