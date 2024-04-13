import { version } from '../../../../../package.json';
import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import { documentationUrl, githubUrl, websiteUrl } from '../../../../externals';
import * as Panel from '../PanelUtils';

import CheckUpdatesButton from './CheckUpdatesButton';

export default function AboutPanel() {
  return (
    <>
      <Panel.Header>About Ontime</Panel.Header>
      <Panel.Section>
        <Panel.SubHeader>Ontime</Panel.SubHeader>
        <Panel.Paragraph>
          Free, open-source software for managing rundowns and event timers
          <ExternalLink href={websiteUrl}>www.getontime.no</ExternalLink>
        </Panel.Paragraph>
      </Panel.Section>
      <Panel.Section>
        <Panel.SubHeader>Links</Panel.SubHeader>
        <ExternalLink href={documentationUrl}>Read the docs</ExternalLink>
        <ExternalLink href={githubUrl}>Follow the project on GitHub</ExternalLink>
      </Panel.Section>
      <Panel.Section>
        <Panel.SubHeader>Current version</Panel.SubHeader>
        <Panel.Paragraph>{`You are currently using Ontime ${version}`}</Panel.Paragraph>
        <CheckUpdatesButton version={version} />
      </Panel.Section>
    </>
  );
}
