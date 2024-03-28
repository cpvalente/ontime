import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { PanelBaseProps } from '../../settingsStore';
import * as Panel from '../PanelUtils';

import ManageProjects from './ManageProjects';
import ProjectData from './ProjectData';

export default function ProjectPanel({ location }: PanelBaseProps) {
  const projectRef = useScrollIntoView<HTMLDivElement>('project', location);
  const manageRef = useScrollIntoView<HTMLDivElement>('manage', location);

  return (
    <>
      <Panel.Header>Project</Panel.Header>
      <div ref={projectRef}>
        <ProjectData />
      </div>
      <div ref={manageRef}>
        <ManageProjects />
      </div>
    </>
  );
}
