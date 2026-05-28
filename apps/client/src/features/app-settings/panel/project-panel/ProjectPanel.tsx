import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { useAppSettingsScroll } from '../../AppSettingsScrollContext';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import QuickStart from '../../quick-start/QuickStart';
import type { SettingsOptionId } from '../../useAppSettingsMenu';
import ManageProjects from './ManageProjects';

interface ProjectPanelProps extends PanelBaseProps {
  setLocation: (location: SettingsOptionId) => void;
}

export default function ProjectPanel({ location, setLocation }: ProjectPanelProps) {
  const { setActiveSection } = useAppSettingsScroll();
  const manageProjectsRef = useScrollIntoView<HTMLDivElement>('list', location, setActiveSection);

  const handleQuickClose = () => {
    setLocation('project');
  };

  return (
    <>
      <Panel.Header>Project</Panel.Header>
      <QuickStart isOpen={location === 'create'} onClose={handleQuickClose} />
      <div ref={manageProjectsRef}>
        <ManageProjects />
      </div>
    </>
  );
}
