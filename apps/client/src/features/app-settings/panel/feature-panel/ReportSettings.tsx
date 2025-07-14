import { useMemo } from 'react';
import { IoTrashBin } from 'react-icons/io5';

import { deleteAllReport } from '../../../../common/api/report';
import { createBlob, downloadBlob } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import useReport from '../../../../common/hooks-query/useReport';
import useRundown from '../../../../common/hooks-query/useRundown';
import { cx } from '../../../../common/utils/styleUtils';
import { formatTime } from '../../../../common/utils/time';
import * as Panel from '../../panel-utils/PanelUtils';

import { CombinedReport, getCombinedReport, makeReportCSV } from './reportSettings.utils';

import style from './ReportSettings.module.scss';

export default function ReportSettings() {
  const { data: reportData } = useReport();
  const { data } = useRundown();

  const clearReport = async () => await deleteAllReport();
  const downloadCSV = (combinedReport: CombinedReport[]) => {
    if (!combinedReport) {
      return;
    }
    const csv = makeReportCSV(combinedReport);
    const blob = createBlob(csv, 'text/csv;charset=utf-8;');
    downloadBlob(blob, 'ontime-report.csv');
  };

  const combinedReport = useMemo(() => {
    return getCombinedReport(reportData, data.entries, data.flatOrder);
  }, [reportData, data.entries, data.flatOrder]);

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Report</Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Panel.Title>
            Manage report
            <Panel.InlineElements>
              <Button onClick={() => downloadCSV(combinedReport)} disabled={combinedReport.length === 0}>
                <IoTrashBin />
                Export CSV
              </Button>
              <Button variant='subtle-destructive' onClick={clearReport} disabled={combinedReport.length === 0}>
                <IoTrashBin />
                Clear All
              </Button>
            </Panel.InlineElements>
          </Panel.Title>
        </Panel.Section>
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
                <Panel.TableEmpty label='Reports are generated when running through the show.' />
              )}

              {combinedReport.map((entry) => {
                const start = (() => {
                  if (entry.actualStart === null) return null;
                  if (entry.actualStart <= entry.scheduledStart) return 'under';
                  return 'over';
                })();
                const end = (() => {
                  if (entry.actualEnd === null) return null;
                  if (entry.actualEnd <= entry.scheduledEnd) return 'under';
                  return 'over';
                })();
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
      </Panel.Card>
    </Panel.Section>
  );
}
