import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import CustomFieldSettings from './CustomFields';
import ManageRundowns from './ManageRundowns';
import RundownDefaultSettings from './RundownDefaultSettings';
import SourcesPanel from './sources-panel/SourcesPanel';

export default function ManagePanel({ location }: PanelBaseProps) {
  const defaultsRef = useScrollIntoView<HTMLDivElement>('defaults', location);
  const customRef = useScrollIntoView<HTMLDivElement>('custom', location);
  const rundownsRef = useScrollIntoView<HTMLDivElement>('rundowns', location);
  const sheetsRef = useScrollIntoView<HTMLDivElement>('sheets', location);

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
