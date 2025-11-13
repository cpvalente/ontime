import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import useAppVersion from '../../../../common/hooks-query/useAppVersion';
import { appVersion, isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

export default function AppVersion() {
  const { data, isError } = useAppVersion();

  if (isError) {
    return (
      <Panel.Paragraph>
        {`You are currently using Ontime version ${appVersion}`}
        <Panel.Error>Could not fetch version information</Panel.Error>
      </Panel.Paragraph>
    );
  }

  if (data.hasUpdates) {
    return (
      <Panel.Paragraph>
        {`You are currently using Ontime version ${appVersion}.`}
        <br />
        <br />
        {`A new version ${data.version} is available.`} <br />
        {isOntimeCloud ? (
          'You can restart your stage to get the latest available version.'
        ) : (
          <ExternalLink href={data.url}>Please visit the release page to download</ExternalLink>
        )}
      </Panel.Paragraph>
    );
  }

  return <Panel.Paragraph>{`You are currently using the latest version of Ontime: ${appVersion}`}</Panel.Paragraph>;
}
