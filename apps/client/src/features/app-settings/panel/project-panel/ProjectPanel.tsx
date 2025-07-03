import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import QuickStart from '../../quick-start/QuickStart';
import type { SettingsOptionId } from '../../useAppSettingsMenu';

import ManageProjects from './ManageProjects';
import ManageRundowns from './ManageRundowns';
import ProjectData from './ProjectData';

interface ProjectPanelProps extends PanelBaseProps {
  setLocation: (location: SettingsOptionId) => void;
}

export default function ProjectPanel({ location, setLocation }: ProjectPanelProps) {
  const projectRef = useScrollIntoView<HTMLDivElement>('data', location);
  const manageRundownsRef = useScrollIntoView<HTMLDivElement>('rundowns', location);
  const manageProjectsRef = useScrollIntoView<HTMLDivElement>('list', location);

  const handleQuickClose = () => {
    setLocation('project');
  };

  return (
    <>
      <Panel.Header>Project</Panel.Header>
      <QuickStart isOpen={location === 'create'} onClose={handleQuickClose} />
      <div ref={projectRef}>
        <ProjectData />
      </div>
      <div ref={manageRundownsRef}>
        <ManageRundowns />
      </div>
      <div ref={manageProjectsRef}>
        <ManageProjects />
      </div>
    </>
  );
}
