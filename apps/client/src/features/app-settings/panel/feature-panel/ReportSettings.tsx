import { useEffect, useState } from 'react';

import Select from '../../../../common/components/select/Select';
import { useProjectRundowns } from '../../../../common/hooks-query/useProjectRundowns';
import useRuns from '../../../../common/hooks-query/useRuns';
import * as Panel from '../../panel-utils/PanelUtils';
import RunDetail from './composite/RunDetail';
import RunsList from './composite/RunsList';

const allRundowns = 'all';

export default function ReportSettings() {
  const { data: rundownsList } = useProjectRundowns();
  const [rundownFilter, setRundownFilter] = useState<string>(allRundowns);
  const { data: runs } = useRuns(rundownFilter === allRundowns ? undefined : rundownFilter);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // keep a valid selection: default to the most recent run, and fall off the
  // current one when it drops out of the filtered list
  useEffect(() => {
    if (selectedRunId && runs.some((run) => run.id === selectedRunId)) return;
    setSelectedRunId(runs[0]?.id ?? null);
  }, [runs, selectedRunId]);

  const rundownOptions = [
    { value: allRundowns, label: 'All rundowns' },
    ...rundownsList.rundowns.map((rundown) => ({ value: rundown.id, label: rundown.title || 'Untitled rundown' })),
  ];

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>
          Show reports
          {rundownsList.rundowns.length > 1 && (
            <Select
              value={rundownFilter}
              onValueChange={(value: string | null) => value && setRundownFilter(value)}
              options={rundownOptions}
            />
          )}
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Paragraph>
          A run is created the first time an event is started, and is added to history once playback stops. Every
          run keeps its own snapshot of the schedule, so editing the rundown later does not change past reports.
        </Panel.Paragraph>
        <RunsList runs={runs} rundownId={rundownFilter === allRundowns ? undefined : rundownFilter} selectedRunId={selectedRunId} onSelect={setSelectedRunId} />
      </Panel.Card>
      {selectedRunId && (
        <Panel.Card>
          <RunDetail runId={selectedRunId} />
        </Panel.Card>
      )}
    </Panel.Section>
  );
}
