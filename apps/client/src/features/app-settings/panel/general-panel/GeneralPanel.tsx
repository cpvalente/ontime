import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { PanelBaseProps } from '../../settingsStore';
import * as Panel from '../PanelUtils';

import GeneralPanelForm from './GeneralPanelForm';
import UrlPresetsForm from './UrlPresetsForm';
import ViewSettingsForm from './ViewSettingsForm';

export default function GeneralPanel({ location }: PanelBaseProps) {
  const manageRef = useScrollIntoView<HTMLDivElement>('manage', location);
  const viewRef = useScrollIntoView<HTMLDivElement>('view', location);
  const urlPresetsRef = useScrollIntoView<HTMLDivElement>('urlpresets', location);

  return (
    <>
      <Panel.Header>App Settings</Panel.Header>
      <div ref={manageRef}>
        <GeneralPanelForm />
      </div>
      <div ref={viewRef}>
        <ViewSettingsForm />
      </div>
      <div ref={urlPresetsRef}>
        <UrlPresetsForm />
      </div>
    </>
  );
}
