import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import QuickStart from '../../quick-start/QuickStart';
import type { SettingsOptionId } from '../../useAppSettingsMenu';

import ManageProjects from './ManageProjects';
import ProjectData from './ProjectData';

interface ProjectPanelProps extends PanelBaseProps {
  setLocation: (location: SettingsOptionId) => void;
}

export default function ProjectPanel({ location, setLocation }: ProjectPanelProps) {
  const projectRef = useScrollIntoView<HTMLDivElement>('data', location);
  const manageRef = useScrollIntoView<HTMLDivElement>('manage', location);

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
      <div ref={manageRef}>
        <ManageProjects />
      </div>
    </>
  );
}
