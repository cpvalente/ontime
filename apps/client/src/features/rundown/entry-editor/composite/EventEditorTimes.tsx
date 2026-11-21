import { EndAction, MaybeNumber, PhaseThresholds, TimeStrategy, TimerType } from 'ontime-types';
import { getDelayedEnd, resolvePhaseThresholds } from 'ontime-utils';
import { memo } from 'react';
import { IoInformationCircle } from 'react-icons/io5';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import Select from '../../../../common/components/select/Select';
import Switch from '../../../../common/components/switch/Switch';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import { useEntryActionsContext } from '../../../../common/context/EntryActionsContext';
import useSettings from '../../../../common/hooks-query/useSettings';
import { millisToDelayString } from '../../../../common/utils/dateConfig';
import { cx } from '../../../../common/utils/styleUtils';
import { formatTime, normaliseWallClock } from '../../../../common/utils/time';
import TimeInputFlow from '../../time-input-flow/TimeInputFlow';
import { PhaseThresholdIssue, getPhaseThresholdIssue } from '../entryEditor.utils';
import PhaseOverrideInput, { PhaseField } from './PhaseOverrideInput';

import style from '../EntryEditor.module.scss';

interface EventEditorTimesProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: boolean;
  countToEnd: boolean;
  delay: number;
  endAction: EndAction;
  timerType: TimerType;
  timeWarning: MaybeNumber;
  timeDanger: MaybeNumber;
  groupThresholds: PhaseThresholds | null;
}

type HandledActions = 'countToEnd' | 'timerType' | 'endAction';

const phaseIssueLabel: Record<PhaseThresholdIssue, string> = {
  'warning-exceeds-duration': 'Warning is as long as the event, the timer starts in warning',
  'danger-exceeds-warning': 'Danger is longer than warning, the timer skips warning',
};

export default memo(EventEditorTimes);
function EventEditorTimes({
  eventId,
  timeStart,
  timeEnd,
  duration,
  timeStrategy,
  linkStart,
  countToEnd,
  delay,
  endAction,
  timerType,
  timeWarning,
  timeDanger,
  groupThresholds,
}: EventEditorTimesProps) {
  const { updateEntry } = useEntryActionsContext();
  const { data: settings } = useSettings();
  const resolved = resolvePhaseThresholds(
    { timeWarning, timeDanger, duration },
    groupThresholds,
    settings.phaseThresholds,
  );
  const phaseIssue = getPhaseThresholdIssue(resolved, duration);
  // views only show phases on count down timers, see getShowModifiers()
  const showsPhases = timerType === TimerType.CountDown || countToEnd;

  const handlePhaseSubmit = (field: PhaseField, value: MaybeNumber) => {
    updateEntry({ id: eventId, [field]: value });
  };

  const handleSubmit = (field: HandledActions, value: string | boolean) => {
    if (field === 'countToEnd') {
      updateEntry({ id: eventId, countToEnd: value as boolean });
      return;
    }

    if (field === 'timerType' || field === 'endAction') {
      updateEntry({ id: eventId, [field]: value });
      return;
    }
  };

  const hasDelay = delay !== 0;
  const delayedStart = normaliseWallClock(timeStart + delay);
  const delayedEnd = normaliseWallClock(getDelayedEnd({ timeEnd, delay, countToEnd }));
  const delayLabel = hasDelay
    ? `Event is ${millisToDelayString(delay, 'expanded')}. New schedule ${formatTime(delayedStart)} → ${formatTime(delayedEnd)}`
    : '';

  return (
    <>
      <div className={style.column}>
        <Editor.Title>Event schedule</Editor.Title>
        <div>
          <div className={style.inline}>
            <TimeInputFlow
              eventId={eventId}
              timeStart={timeStart}
              timeEnd={timeEnd}
              duration={duration}
              timeStrategy={timeStrategy}
              linkStart={linkStart}
              delay={delay}
              showLabels
            />
          </div>
          <div className={style.delayLabel}>{delayLabel}</div>
        </div>
      </div>

      <div className={style.column}>
        <Editor.Title>Event Behaviour</Editor.Title>
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='endAction'>End Action</Editor.Label>
            <Select
              value={endAction}
              onValueChange={(value: EndAction | null) => {
                if (value === null) return;
                handleSubmit('endAction', value);
              }}
              options={[
                { value: EndAction.None, label: 'None' },
                { value: EndAction.LoadNext, label: 'Load next event' },
                { value: EndAction.PlayNext, label: 'Play next event' },
              ]}
            />
          </div>
          <div>
            <Editor.Label htmlFor='countToEnd'>Count to End</Editor.Label>
            <Editor.Label className={style.switchLabel}>
              <Switch
                id='countToEnd'
                checked={countToEnd}
                onCheckedChange={(value) => handleSubmit('countToEnd', value)}
              />
              {countToEnd ? 'On' : 'Off'}
            </Editor.Label>
          </div>
        </div>
      </div>

      <div className={style.column}>
        <Editor.Title>
          <Tooltip
            text='Changes how the timer is displayed in different views. It is not reflected in the rundown'
            render={<span />}
          >
            Display Options
            <IoInformationCircle className={style.tooltipIcon} />
          </Tooltip>
        </Editor.Title>
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='timerType'>Timer Type</Editor.Label>
            <Select
              value={timerType}
              onValueChange={(value: TimerType | null) => {
                if (value === null) return;
                handleSubmit('timerType', value);
              }}
              options={[
                { value: TimerType.CountDown, label: 'Count down' },
                { value: TimerType.CountUp, label: 'Count up' },
                { value: TimerType.Clock, label: 'Clock' },
                { value: TimerType.None, label: 'None' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className={style.column}>
        <Editor.Title>Warning and danger</Editor.Title>
        <div className={style.inline}>
          <PhaseOverrideInput
            field='timeWarning'
            label='Warning Time'
            value={timeWarning}
            resolved={resolved.timeWarning}
            submitHandler={handlePhaseSubmit}
          />
          <PhaseOverrideInput
            field='timeDanger'
            label='Danger Time'
            value={timeDanger}
            resolved={resolved.timeDanger}
            submitHandler={handlePhaseSubmit}
          />
        </div>
        {!showsPhases && (
          <div className={style.phaseHint}>Warning and danger only show on count down timers or with count to end</div>
        )}
        {showsPhases && phaseIssue && (
          <div className={cx([style.phaseHint, style.phaseIssue])}>{phaseIssueLabel[phaseIssue]}</div>
        )}
      </div>
    </>
  );
}
