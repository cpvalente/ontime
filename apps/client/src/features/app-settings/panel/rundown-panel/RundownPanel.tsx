import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import AuxTimerSettings from './AuxTimerSettings';
import CustomFieldSettings from './CustomFields';
import ManageRundowns from './ManageRundowns';
import ReportSettings from './ReportSettings';
import RundownDefaultSettings from './RundownDefaultSettings';
import SourcesPanel from './sources-panel/SourcesPanel';

export default function RundownPanel({ location }: PanelBaseProps) {
  const rundownsRef = useScrollIntoView<HTMLDivElement>('rundowns', location);
  const sheetsRef = useScrollIntoView<HTMLDivElement>('sheets', location);
  const customRef = useScrollIntoView<HTMLDivElement>('custom', location);
  const defaultsRef = useScrollIntoView<HTMLDivElement>('defaults', location);
  const auxTimersRef = useScrollIntoView<HTMLDivElement>('aux-timers', location);
  const reportRef = useScrollIntoView<HTMLDivElement>('report', location);

  return (
    <>
      <Panel.Header>Rundown</Panel.Header>
      <div ref={rundownsRef}>
        <ManageRundowns />
      </div>
      <div ref={sheetsRef}>
        <SourcesPanel />
      </div>
      <div ref={customRef}>
        <CustomFieldSettings />
      </div>
      <div ref={defaultsRef}>
        <RundownDefaultSettings />
      </div>
      <div ref={auxTimersRef}>
        <AuxTimerSettings />
      </div>
      <div ref={reportRef}>
        <ReportSettings />
      </div>
    </>
  );
}
