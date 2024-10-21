import { ReportData } from 'ontime-types';

// import { useTimelineStatus } from '../../../../common/hooks/useSocket';
import useReport from '../../../../common/hooks-query/useReport';
import { formatDuration } from '../../../../common/utils/time';

export default function EventBlockReporter(props: { id: string }) {
  const { id } = props;
  const { data } = useReport();
  //   const { clock, offset } = useTimelineStatus();

  const report: ReportData | undefined = data[id];

  const overUnder = report?.overUnder ?? 0;
  const isNegative = overUnder < 0;
  const reportDisplay = `${isNegative ? '-' : ''}${formatDuration(Math.abs(overUnder), false)}`;

  return <div>{reportDisplay}</div>;
}
