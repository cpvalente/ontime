import { version } from '../../../../../package.json';
import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import useAppVersion from '../../../../common/hooks-query/useAppVersion';
import * as Panel from '../../panel-utils/PanelUtils';

export default function AppVersion() {
  const { data, isError } = useAppVersion();

  if (isError) {
    return (
      <Panel.Paragraph>
        {`You are currently using Ontime version ${version}`}
        <Panel.Error>{`Could not fetch version information: ${isError}`}</Panel.Error>
      </Panel.Paragraph>
    );
  }

  if (data.hasUpdates) {
    return (
      <>
        <Panel.Paragraph>{`You are currently using Ontime version ${version}.`}</Panel.Paragraph>
        <Panel.Paragraph>
          {`A new version ${data.version} is available.`}
          <ExternalLink href={data.url}> Please visit the release page to download</ExternalLink>
        </Panel.Paragraph>
      </>
    );
  }

  return <Panel.Paragraph>{`You are currently using the latest version of Ontime: ${version}`}</Panel.Paragraph>;
}
