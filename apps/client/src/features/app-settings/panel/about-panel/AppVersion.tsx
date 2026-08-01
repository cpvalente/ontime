import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import useAppVersion from '../../../../common/hooks-query/useAppVersion';
import { appVersion, isOntimeCloud, websiteUrl } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

export default function AppVersion() {
  const { data, isError } = useAppVersion();

  if (isError) {
    return (
      <Panel.ListItem>
        <Panel.Field title={`Ontime ${appVersion}`} description='' error='Could not fetch version information' />
      </Panel.ListItem>
    );
  }

  if (data.hasUpdates) {
    return (
      <Panel.ListItem>
        <Panel.Field
          title={`Ontime ${appVersion}`}
          description={
            isOntimeCloud
              ? `Version ${data.version} is available. Restart your stage to update.`
              : `Version ${data.version} is available.`
          }
        />
        {!isOntimeCloud && (
          <ExternalLink href={websiteUrl}>Visit Ontime's page to download the latest version.</ExternalLink>
        )}
      </Panel.ListItem>
    );
  }

  return (
    <Panel.ListItem>
      <Panel.Field title={`Ontime ${appVersion}`} description='You are using the latest version.' />
    </Panel.ListItem>
  );
}
