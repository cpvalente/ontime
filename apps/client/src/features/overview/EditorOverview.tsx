import { memo, PropsWithChildren, useMemo } from 'react';

import { useRuntimeOverview } from '../../common/hooks/useSocket';

import {
  ClockOverview,
  CurrentBlockOverview,
  OverviewWrapper,
  ProgressOverview,
  RuntimeOverview,
  TitlesOverview,
} from './composite/OverviewWrapper';
import { TimeRow } from './composite/TimeLayout';
import { calculateEndAndDaySpan, formatedTime } from './overviewUtils';

import style from './Overview.module.scss';

export default memo(EditorOverview);
function EditorOverview({ children }: PropsWithChildren) {
  const { plannedEnd, plannedStart, actualStart, expectedEnd } = useRuntimeOverview();

  const [maybePlannedEnd, maybePlannedDaySpan] = useMemo(() => calculateEndAndDaySpan(plannedEnd), [plannedEnd]);
  const plannedEndText = formatedTime(maybePlannedEnd);

  const [maybeExpectedEnd, maybeExpectedDaySpan] = useMemo(() => calculateEndAndDaySpan(expectedEnd), [expectedEnd]);
  const expectedEndText = formatedTime(maybeExpectedEnd);

  return (
    <OverviewWrapper navElements={children}>
      <TitlesOverview />
      <div>
        <TimeRow
          label='Planned start'
          value={formatedTime(plannedStart)}
          className={style.start}
          muted={plannedStart === null}
        />
        <TimeRow
          label='Actual start'
          value={formatedTime(actualStart)}
          className={style.start}
          muted={actualStart === null}
        />
      </div>
      <ProgressOverview />
      <RuntimeOverview />
      <CurrentBlockOverview />
      <ClockOverview />
      <div>
        <TimeRow
          label='Planned end'
          value={plannedEndText}
          className={style.end}
          daySpan={maybePlannedDaySpan}
          muted={maybePlannedEnd === null}
        />
        <TimeRow
          label='Expected end'
          value={expectedEndText}
          className={style.end}
          daySpan={maybeExpectedDaySpan}
          muted={maybeExpectedEnd === null}
        />
      </div>
    </OverviewWrapper>
  );
}
