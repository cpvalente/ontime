import * as Panel from '../PanelUtils';

import ManageProjects from './ManageProjects';
import ProjectData from './ProjectData';

export default function ProjectPanel() {
  return (
    <>
      <Panel.Header>Project</Panel.Header>
      <ProjectData />
      <ManageProjects />
    </>
  );
}
