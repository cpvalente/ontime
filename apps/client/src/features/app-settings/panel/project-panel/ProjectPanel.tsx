import { Button } from '@chakra-ui/react';

import * as Panel from '../PanelUtils';

import Upload from './upload/Upload';
import ProjectList from './ProjectList';

export default function ProjectPanel() {
  return (
    <>
      <Panel.Header>Project</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Upload />
        </Panel.Card>
      </Panel.Section>
      <Panel.Section>
        <Panel.SubHeader>
          Manage projects
          <Button variant='ontime-filled'>New</Button>
        </Panel.SubHeader>
        <Panel.Section>
          <Panel.Card>
            <ProjectList />
          </Panel.Card>
        </Panel.Section>
      </Panel.Section>
    </>
  );
}
