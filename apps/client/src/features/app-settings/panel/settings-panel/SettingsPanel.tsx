import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { isDocker } from '../../../../externals';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import CustomViews from '../manage-panel/CustomViews';
import AuxTimerSettings from './AuxTimerSettings';
import GeneralSettings from './GeneralSettings';
import McpSection from './McpSection';
import ProjectData from './ProjectData';
import ServerPortSettings from './ServerPortSettings';
import ViewSettings from './ViewSettings';

export default function SettingsPanel({ location }: PanelBaseProps) {
  const dataRef = useScrollIntoView<HTMLDivElement>('data', location);
  const generalRef = useScrollIntoView<HTMLDivElement>('general', location);
  const auxTimersRef = useScrollIntoView<HTMLDivElement>('aux-timers', location);
  const viewRef = useScrollIntoView<HTMLDivElement>('view', location);
  const customViewsRef = useScrollIntoView<HTMLDivElement>('custom-views', location);
  const mcpRef = useScrollIntoView<HTMLDivElement>('mcp', location);
  const portRef = useScrollIntoView<HTMLDivElement>('port', location);

  return (
    <>
      <Panel.Header>Settings</Panel.Header>
      <div ref={dataRef}>
        <ProjectData />
      </div>
      <div ref={generalRef}>
        <GeneralSettings />
      </div>
      <div ref={auxTimersRef}>
        <AuxTimerSettings />
      </div>
      <div ref={viewRef}>
        <ViewSettings />
      </div>
      <div ref={customViewsRef}>
        <CustomViews />
      </div>
      <div ref={mcpRef}>
        <McpSection />
      </div>
      {!isDocker && (
        <div ref={portRef}>
          <ServerPortSettings />
        </div>
      )}
    </>
  );
}
