import { useMemo } from 'react';
import { IoDownloadOutline, IoTrashBin } from 'react-icons/io5';

import { deleteAllReport } from '../../../../common/api/report';
import { createBlob, downloadBlob } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import useReport from '../../../../common/hooks-query/useReport';
import * as Panel from '../../panel-utils/PanelUtils';
import ReportShowSummary from './composite/ReportShowSummary';
import ReportTable from './composite/ReportTable';
import { getCombinedReport, getGroupReports, getRunSummary, makeReportCSV } from './reportSettings.utils';

export default function ReportSettings() {
  const { report } = useReport();
  const { eventReports, rundown, show } = report;

  const { combinedReport, groups, summary } = useMemo(() => {
    const entries = rundown?.entries ?? {};
    return {
      combinedReport: rundown ? getCombinedReport(eventReports, entries, rundown.flatOrder) : [],
      groups: rundown ? getGroupReports(eventReports, entries, rundown.order) : [],
      summary: getRunSummary(eventReports, entries, rundown?.flatOrder ?? []),
    };
  }, [eventReports, rundown]);

  const hasReport = rundown !== null && Object.keys(eventReports).length > 0;
  const downloadCSV = () => {
    if (!hasReport) return;

    const csv = makeReportCSV(combinedReport);
    const blob = createBlob(csv, 'text/csv;charset=utf-8;');
    downloadBlob(blob, 'ontime-report.csv');
  };

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>
          Report
          <Panel.InlineElements>
            <Button onClick={downloadCSV} disabled={!hasReport}>
              <IoDownloadOutline />
              Export CSV
            </Button>
            <Button variant='subtle-destructive' onClick={deleteAllReport} disabled={!hasReport}>
              <IoTrashBin />
              Clear Report
            </Button>
          </Panel.InlineElements>
        </Panel.SubHeader>
        <Panel.Divider />

        {!hasReport ? (
          <Panel.Section>
            <Panel.EmptyState
              title='No report yet'
              description='Start an event to record actual timings against the schedule.'
            />
          </Panel.Section>
        ) : (
          <>
            <Panel.Section>
              <ReportShowSummary rundownTitle={rundown.title} show={show} summary={summary} />
            </Panel.Section>
            <Panel.Section>
              <ReportTable rows={combinedReport} groups={groups} />
            </Panel.Section>
          </>
        )}
      </Panel.Card>
    </Panel.Section>
  );
}
