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
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button variant='ontime-subtle' onClick={handleToggleCreate} size='sm'>
                Import
              </Button>
              <Button variant='ontime-subtle' onClick={handleToggleCreate} size='sm'>
                Add
              </Button>
            </div>
          </Panel.SubHeader>
          <ProjectList onToggleCreate={handleToggleCreate} isCreatingProject={isCreatingProject} />
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
