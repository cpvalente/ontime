import { ReportData } from 'ontime-types';

import { useTimelineStatus } from '../../../../common/hooks/useSocket';
import useReport from '../../../../common/hooks-query/useReport';
import { formatDuration } from '../../../../common/utils/time';
import { getTimeToStart } from '../../../../views/timeline/timeline.utils';

import style from './EventBlockReporter.module.scss';

export default function EventBlockReporter(props: { id: string; timeStart: number }) {
  const { id, timeStart } = props;
  const { data } = useReport();
  const { clock, offset } = useTimelineStatus();

  const report: ReportData | undefined = data[id];

  const overUnder = report?.overUnder ?? 0;
  const isNegative = overUnder < 0;
  const reportDisplay = `${isNegative ? '-' : ''}${formatDuration(Math.abs(overUnder), false)}`;

  const timeUntil = formatDuration(getTimeToStart(clock, timeStart, 0, offset), false);

  // we show report display if the event is over
  // otherwise we show time until
  return <div className={style.chip}>{report ? reportDisplay : timeUntil}</div>;
}
