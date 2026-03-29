import { PropsWithChildren, memo } from 'react';

import { EditorLayoutMode, useEditorLayout } from '../../views/editor/useEditorLayout';
import {
  ClockOverview,
  MetadataTimes,
  OffsetOverview,
  PlanningStats,
  ProgressOverview,
  StartTimesPlanning,
  StartTimesRuntime,
} from './composite/TimeElements';
import TitleOverview from './composite/TitleOverview';
import { OverviewWrapper } from './OverviewWrapper';

import style from './Overview.module.scss';

export default memo(EditorOverview);

function EditorOverview({ children }: PropsWithChildren) {
  const { layoutMode } = useEditorLayout();

  return (
    <OverviewWrapper navElements={children}>
      {layoutMode === EditorLayoutMode.PLANNING && <OverviewPlanning />}
      {layoutMode === EditorLayoutMode.TRACKING && <OverviewTracking />}
      {layoutMode === EditorLayoutMode.CONTROL && <OverviewControl />}
    </OverviewWrapper>
  );
}

function OverviewPlanning() {
  return (
    <>
      <div className={style.inline}>
        <TitleOverview />
        <StartTimesPlanning shouldFormat />
        <PlanningStats />
      </div>
      <ClockOverview shouldFormat />
    </>
  );
}

function OverviewTracking() {
  return (
    <>
      <div className={style.inline}>
        <StartTimesRuntime shouldFormat />
        <ProgressOverview />
        <OffsetOverview />
      </div>
      <MetadataTimes />
      <ClockOverview shouldFormat />
    </>
  );
}

function OverviewControl() {
  return (
    <>
      <TitleOverview />
      <div className={style.inline}>
        <StartTimesRuntime shouldFormat />
        <ProgressOverview />
        <OffsetOverview />
      </div>
      <MetadataTimes />
      <ClockOverview shouldFormat />
    </>
  );
}
