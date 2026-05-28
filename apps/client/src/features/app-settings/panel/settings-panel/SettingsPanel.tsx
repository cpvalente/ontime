import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { isDocker } from '../../../../externals';
import { useAppSettingsScroll } from '../../AppSettingsScrollContext';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import CustomViews from '../manage-panel/CustomViews';
import GeneralSettings from './GeneralSettings';
import ProjectData from './ProjectData';
import ServerPortSettings from './ServerPortSettings';
import ViewSettings from './ViewSettings';

export default function SettingsPanel({ location }: PanelBaseProps) {
  const { setActiveSection } = useAppSettingsScroll();
  const dataRef = useScrollIntoView<HTMLDivElement>('data', location, setActiveSection);
  const generalRef = useScrollIntoView<HTMLDivElement>('general', location, setActiveSection);
  const viewRef = useScrollIntoView<HTMLDivElement>('view', location, setActiveSection);
  const customViewsRef = useScrollIntoView<HTMLDivElement>('custom-views', location, setActiveSection);
  const portRef = useScrollIntoView<HTMLDivElement>('port', location, setActiveSection);

  return (
    <>
      <Panel.Header>Settings</Panel.Header>
      <div ref={dataRef}>
        <ProjectData />
      </div>
      <div ref={generalRef}>
        <GeneralSettings />
      </div>
      <div ref={viewRef}>
        <ViewSettings />
      </div>
      <div ref={customViewsRef}>
        <CustomViews />
      </div>
      {!isDocker && (
        <div ref={portRef}>
          <ServerPortSettings />
        </div>
      )}
    </>
  );
}
