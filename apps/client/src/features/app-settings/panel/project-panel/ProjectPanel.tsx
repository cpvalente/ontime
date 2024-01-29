import { useState } from 'react';
import { Button } from '@chakra-ui/react';

import * as Panel from '../PanelUtils';

import ProjectList from './ProjectList';

export default function ProjectPanel() {
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const handleToggleCreate = () => {
    setIsCreatingProject((prev) => !prev);
  };

  return (
    <>
      <Panel.Header>Project</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>
            Manage projects
            <Button variant='ontime-filled' onClick={handleToggleCreate}>
              New
            </Button>
          </Panel.SubHeader>
          <ProjectList onToggleCreate={handleToggleCreate} isCreatingProject={isCreatingProject} />
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
