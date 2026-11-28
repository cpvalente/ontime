import Button from '../../../../common/components/buttons/Button';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import { useElectronEvent } from '../../../../common/hooks/useElectronEvent';
import { capabilities, dashboardUrl, isLocalhost } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

export default function ShutdownPanel() {
  const { isElectron, sendToElectron } = useElectronEvent();

  const sendShutdown = () => {
    sendToElectron('shutdown', 'now');
  };

  const isServerMachine = isElectron || isLocalhost;

  return (
    <>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>Shutdown</Panel.SubHeader>
          <Panel.Divider />
          {capabilities.canShutdown ? (
            <>
              <Panel.Field
                title='Stop the Ontime server'
                description='Your project is kept, the runtime state is lost.'
              />
              <Panel.Section>
                <Button variant='destructive' onClick={sendShutdown} disabled={!isServerMachine}>
                  Shutdown Ontime
                </Button>
                {!isServerMachine && (
                  <Panel.Description>Only available from the machine running Ontime.</Panel.Description>
                )}
              </Panel.Section>
            </>
          ) : (
            <>
              <Panel.Field
                title='Ontime Cloud dashboard'
                description='The server is shut down from the Ontime Cloud dashboard.'
              />
              {dashboardUrl && (
                <Panel.Section>
                  <ExternalLink href={dashboardUrl}>Open the Ontime Cloud dashboard</ExternalLink>
                </Panel.Section>
              )}
            </>
          )}
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
