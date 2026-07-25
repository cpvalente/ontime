import { EndAction, OntimeEvent, TimerType } from 'ontime-types';
import { parseUserTime } from 'ontime-utils';
import { memo } from 'react';
import { IoInformationCircle } from 'react-icons/io5';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import Select from '../../../../common/components/select/Select';
import Switch from '../../../../common/components/switch/Switch';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import { mixedPlaceholder, switchLabel } from '../entryEditor.utils';

import style from '../EntryEditor.module.scss';

interface EventEditorTimesProps {
  countToEnd: boolean | undefined;
  endAction: EndAction | undefined;
  timerType: TimerType | undefined;
  timeWarning: number | undefined;
  timeDanger: number | undefined;
  submit: (patch: Partial<OntimeEvent>) => void;
}

type TimeFields = 'timeWarning' | 'timeDanger';

export default memo(EventEditorTimes);
function EventEditorTimes({
  countToEnd,
  endAction,
  timerType,
  timeWarning,
  timeDanger,
  submit,
}: EventEditorTimesProps) {
  const handleTimeSubmit = (field: TimeFields, value: string) => {
    submit({ [field]: parseUserTime(value) });
  };

  return (
    <>
      <div className={style.column}>
        <Editor.Title>Event Behaviour</Editor.Title>
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='endAction'>End Action</Editor.Label>
            <Select
              value={endAction ?? null}
              placeholder={mixedPlaceholder}
              onValueChange={(value: EndAction | null) => {
                if (value === null) return;
                submit({ endAction: value });
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
                checked={countToEnd ?? false}
                mixed={countToEnd === undefined}
                onCheckedChange={(value) => submit({ countToEnd: value })}
              />
              {switchLabel(countToEnd)}
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
              value={timerType ?? null}
              placeholder={mixedPlaceholder}
              onValueChange={(value: TimerType | null) => {
                if (value === null) return;
                submit({ timerType: value });
              }}
              options={[
                { value: TimerType.CountDown, label: 'Count down' },
                { value: TimerType.CountUp, label: 'Count up' },
                { value: TimerType.Clock, label: 'Clock' },
                { value: TimerType.None, label: 'None' },
              ]}
            />
          </div>

          <div className={style.inline}>
            <div>
              <Editor.Label htmlFor='timeWarning'>Warning Time</Editor.Label>
              <TimeInput
                id='timeWarning'
                name='timeWarning'
                submitHandler={handleTimeSubmit}
                time={timeWarning}
                placeholder={timeWarning === undefined ? mixedPlaceholder : 'Duration'}
              />
            </div>
            <div>
              <Editor.Label htmlFor='timeDanger'>Danger Time</Editor.Label>
              <TimeInput
                id='timeDanger'
                name='timeDanger'
                submitHandler={handleTimeSubmit}
                time={timeDanger}
                placeholder={timeDanger === undefined ? mixedPlaceholder : 'Duration'}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
