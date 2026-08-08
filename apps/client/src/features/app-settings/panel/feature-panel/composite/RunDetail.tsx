import { useMemo } from 'react';
import { IoDownload } from 'react-icons/io5';

import { createBlob, downloadBlob } from '../../../../../common/api/utils';
import Button from '../../../../../common/components/buttons/Button';
import { useRundownById } from '../../../../../common/hooks-query/useRundown';
import { useRun } from '../../../../../common/hooks-query/useRuns';
import { cx } from '../../../../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../../../../common/utils/time';
import * as Panel from '../../../panel-utils/PanelUtils';
import { CombinedReport, formatDrift, getCombinedReport, makeReportCSV } from '../reportSettings.utils';

import style from './RunDetail.module.scss';

interface RunDetailProps {
  runId: string;
}

export default function RunDetail({ runId }: RunDetailProps) {
  const { data: run, status } = useRun(runId);
  // resolves the rundown the run belongs to, independent of what is currently loaded,
  // so titles and cues are correct even when browsing an older run
  const { data: rundown } = useRundownById(run?.rundownId);

  const combinedReport = useMemo(() => {
    if (!run) return [];
    return getCombinedReport(run.report, rundown.entries, rundown.flatOrder);
  }, [run, rundown]);

  const downloadCSV = (report: CombinedReport[]) => {
    if (!run || report.length === 0) return;
    const csv = makeReportCSV(report);
    const filename = `ontime-report-${run.label.replace(/\s+/g, '-').toLowerCase()}.csv`;
    const blob = createBlob(csv, 'text/csv;charset=utf-8;');
    downloadBlob(blob, filename);
  };

  if (status === 'pending' || !run) {
    return null;
  }

  return (
    <Panel.Section>
      <Panel.SubHeader>
        {run.label}
        <Button onClick={() => downloadCSV(combinedReport)} disabled={combinedReport.length === 0}>
          <IoDownload />
          Export CSV
        </Button>
      </Panel.SubHeader>
      <Panel.Divider />
      <div className={style.summary}>
        <Stat label='Events run' value={`${run.summary.eventsRun} / ${run.summary.eventsPlanned}`} />
        <Stat label='Scheduled' value={formatDuration(run.summary.scheduledDuration, false)} />
        <Stat label='Actual' value={formatDuration(run.summary.actualDuration, false)} />
        <Stat label='Drift' value={formatDrift(run.summary.drift, run.summary.eventsRun)} />
        <Stat label='On time' value={`${run.summary.eventsOnTime}`} />
        <Stat label='Over' value={`${run.summary.eventsOver}`} />
        <Stat label='Under' value={`${run.summary.eventsUnder}`} />
      </div>
      <Panel.Section>
        <Panel.Table>
          <thead>
            <tr>
              <th>#</th>
              <th>Cue</th>
              <th>Title</th>
              <th>Scheduled Start</th>
              <th>Actual Start</th>
              <th>Scheduled End</th>
              <th>Actual End</th>
            </tr>
          </thead>
          <tbody>
            {combinedReport.length === 0 && (
              <Panel.TableEmpty title='No events in this run' description='This run has no recorded events yet.' />
            )}
            {combinedReport.map((entry) => {
              const start = punctuality(entry.actualStart, entry.scheduledStart);
              const end = punctuality(entry.actualEnd, entry.scheduledEnd);
              return (
                <tr key={entry.id}>
                  <th>{entry.index}</th>
                  <th>{entry.cue}</th>
                  <th>{entry.title}</th>
                  <th className={cx([start && style[start]])}>{formatTime(entry.scheduledStart)}</th>
                  <th className={cx([start && style[start]])}>{formatTime(entry.actualStart)}</th>
                  <th className={cx([end && style[end]])}>{formatTime(entry.scheduledEnd)}</th>
                  <th className={cx([end && style[end]])}>{formatTime(entry.actualEnd)}</th>
                </tr>
              );
            })}
          </tbody>
        </Panel.Table>
      </Panel.Section>
    </Panel.Section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={style.stat}>
      <span className={style.statLabel}>{label}</span>
      <span className={style.statValue}>{value}</span>
    </div>
  );
}

/** Whether an actual time landed before (under) or after (over) its schedule */
function punctuality(actual: number | null, scheduled: number): 'under' | 'over' | null {
  if (actual === null) return null;
  return actual <= scheduled ? 'under' : 'over';
}
