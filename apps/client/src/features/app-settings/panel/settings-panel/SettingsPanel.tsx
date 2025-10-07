import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';

import GeneralSettings from './GeneralSettings';
import ProjectData from './ProjectData';
import ViewSettings from './ViewSettings';

export default function SettingsPanel({ location }: PanelBaseProps) {
  const dataRef = useScrollIntoView<HTMLDivElement>('data', location);
  const generalRef = useScrollIntoView<HTMLDivElement>('general', location);
  const viewRef = useScrollIntoView<HTMLDivElement>('view', location);

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
    </>
  );
}
