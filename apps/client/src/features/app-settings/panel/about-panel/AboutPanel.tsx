import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import {
  buyMeACoffeeUrl,
  discordUrl,
  documentationUrl,
  githubSponsorUrl,
  githubUrl,
  websiteUrl,
} from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import AppVersion from './AppVersion';

export default function AboutPanel() {
  return (
    <>
      <Panel.Header>About Ontime</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>Ontime</Panel.SubHeader>
          <Panel.Paragraph>
            Free, open-source software for managing rundowns and event timers
            <ExternalLink href={websiteUrl}>www.getontime.no</ExternalLink>
          </Panel.Paragraph>
          <Panel.Paragraph>
            Considering sponsoring our work
            <ExternalLink href={githubSponsorUrl}>GitHub Sponsors</ExternalLink>
            <ExternalLink href={buyMeACoffeeUrl}>Buy Me a Coffee</ExternalLink>
          </Panel.Paragraph>
          <Panel.Paragraph>
            And trying out our cloud service
            <ExternalLink href={websiteUrl}>www.getontime.no</ExternalLink>
          </Panel.Paragraph>
        </Panel.Card>
        <Panel.SubHeader>Current version</Panel.SubHeader>
        <AppVersion />
        <Panel.SubHeader>Links</Panel.SubHeader>
        <ExternalLink href={documentationUrl}>Read the docs</ExternalLink>
        <ExternalLink href={githubUrl}>Follow the project on GitHub</ExternalLink>
        <ExternalLink href={discordUrl}>Discord server</ExternalLink>
      </Panel.Section>
    </>
  );
}
