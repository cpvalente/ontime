import {
  buyMeACoffeeUrl,
  discordUrl,
  documentationUrl,
  githubSponsorUrl,
  githubUrl,
  subredditUrl,
  websiteUrl,
  youtubeUrl,
} from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';
import AppVersion from './AppVersion';
import CloudPanel from './CloudPanel';
import ExternalLinkRow from './ExternalLinkRow';

export default function AboutPanel() {
  return (
    <>
      <Panel.Header>About</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>Ontime</Panel.SubHeader>
          <Panel.Divider />
          <Panel.ListGroup>
            <ExternalLinkRow href={websiteUrl} title='www.getontime.no' />
            <ExternalLinkRow href={githubSponsorUrl} title='GitHub Sponsors' />
            <ExternalLinkRow href={buyMeACoffeeUrl} title='Buy Me a Coffee' />
          </Panel.ListGroup>
        </Panel.Card>
      </Panel.Section>
      <CloudPanel />
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>Current version</Panel.SubHeader>
          <Panel.Divider />
          <Panel.ListGroup>
            <AppVersion />
          </Panel.ListGroup>
        </Panel.Card>
      </Panel.Section>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>Helpful links</Panel.SubHeader>
          <Panel.Divider />
          <Panel.ListGroup>
            <ExternalLinkRow href={documentationUrl} title='Read the docs' />
            <ExternalLinkRow href={githubUrl} title='GitHub' />
            <ExternalLinkRow href={youtubeUrl} title='YouTube' />
            <ExternalLinkRow href={discordUrl} title='Discord' />
            <ExternalLinkRow href={subredditUrl} title='Reddit' />
          </Panel.ListGroup>
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
