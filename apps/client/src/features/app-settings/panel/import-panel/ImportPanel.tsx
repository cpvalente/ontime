import * as Panel from '../../panel-utils/PanelUtils';
import SourcesPanel from './sources-panel/SourcesPanel';

export default function ImportPanel() {
  return (
    <>
      <Panel.Header>Import</Panel.Header>
      <SourcesPanel />
    </>
  );
}
