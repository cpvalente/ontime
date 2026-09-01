import Info from '../../../../common/components/info/Info';
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
      <Panel.Header>About Ontime</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>Ontime</Panel.SubHeader>
          <Panel.Divider />
          <Info>Free, open-source software for managing rundowns and event timers.</Info>
          <Panel.ListGroup>
            <ExternalLinkRow href={websiteUrl} title='www.getontime.no' description='App site and downloads' />
            <ExternalLinkRow
              href={githubSponsorUrl}
              title='GitHub Sponsors'
              description='Support development through GitHub'
            />
            <ExternalLinkRow
              href={buyMeACoffeeUrl}
              title='Buy Me a Coffee'
              description='Make a one-time contribution'
            />
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
            <ExternalLinkRow
              href={documentationUrl}
              title='Read the docs'
              description='Setup guides and feature documentation'
            />
            <ExternalLinkRow href={githubUrl} title='GitHub' description='Report issues or contribute to Ontime' />
            <ExternalLinkRow href={youtubeUrl} title='YouTube' description='Watch tutorials and feature walkthroughs' />
            <ExternalLinkRow href={discordUrl} title='Discord' description='Get help and share suggestions' />
            <ExternalLinkRow href={subredditUrl} title='Reddit' description='Join the Ontime community discussion' />
          </Panel.ListGroup>
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
