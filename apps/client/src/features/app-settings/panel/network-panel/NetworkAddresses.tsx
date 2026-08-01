import AppLink from '../../../../common/components/link/app-link/AppLink';
import useServerPort from '../../../../common/hooks-query/useServerPort';
import { isDocker, isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';
import InfoNif from './NetworkInterfaces';

export default function NetworkAddresses() {
  const { data } = useServerPort();

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Server address</Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          {isOntimeCloud ? (
            <Panel.Description>
              Ontime is running in the cloud and is reachable at the address of this page.
            </Panel.Description>
          ) : (
            <>
              <Panel.Description>
                Ontime is streaming on the addresses below. Share one with another machine on the same network, or click
                to open it here.
              </Panel.Description>
              <InfoNif />
            </>
          )}
        </Panel.Section>
        {!isDocker && (
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field
                title='Server port'
                description={
                  data.pendingRestart
                    ? 'A port change is pending, restart Ontime to apply it'
                    : 'The port Ontime is listening on'
                }
                descriptionTone={data.pendingRestart ? 'warning' : 'default'}
              />
              <AppLink search='settings=settings__port'>{`Change port (${data.port})`}</AppLink>
            </Panel.ListItem>
          </Panel.ListGroup>
        )}
      </Panel.Card>
    </Panel.Section>
  );
}
