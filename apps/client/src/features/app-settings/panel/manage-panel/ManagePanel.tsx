import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { useAppSettingsScroll } from '../../AppSettingsScrollContext';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import CustomFieldSettings from './CustomFields';
import ManageRundowns from './ManageRundowns';
import RundownDefaultSettings from './RundownDefaultSettings';
import SourcesPanel from './sources-panel/SourcesPanel';

export default function ManagePanel({ location }: PanelBaseProps) {
  const { setActiveSection } = useAppSettingsScroll();
  const defaultsRef = useScrollIntoView<HTMLDivElement>('defaults', location, setActiveSection);
  const customRef = useScrollIntoView<HTMLDivElement>('custom', location, setActiveSection);
  const rundownsRef = useScrollIntoView<HTMLDivElement>('rundowns', location, setActiveSection);
  const sheetsRef = useScrollIntoView<HTMLDivElement>('sheets', location, setActiveSection);

  return (
    <>
      <Panel.Header>Project data</Panel.Header>
      <div ref={defaultsRef}>
        <RundownDefaultSettings />
      </div>
      <div ref={customRef}>
        <CustomFieldSettings />
      </div>
      <div ref={rundownsRef}>
        <ManageRundowns />
      </div>
      <div ref={sheetsRef}>
        <SourcesPanel />
      </div>
    </>
  );
}
