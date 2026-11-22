import { TimerType } from 'ontime-types';
import { ComponentProps } from 'react';
import { IoArrowDown, IoArrowUp, IoBan, IoTime } from 'react-icons/io5';
import { LuArrowDownToLine } from 'react-icons/lu';

import { CornerWithPip } from '../../../common/components/editor-utils/EditorUtils';
import { getPlayState } from '../../../common/components/play-state/playState.utils';
import PlayStateMark from '../../../common/components/play-state/PlayStateMark';
import Tag from '../../../common/components/tag/Tag';
import useViewSettings from '../../../common/hooks-query/useViewSettings';
import { useMessagePreview } from '../../../common/hooks/useSocket';
import { handleLinks } from '../../../common/utils/linkUtils';
import { cx } from '../../../common/utils/styleUtils';
import PipRoot from '../../../views/editor/pip-timer/PipRoot';
import { PipTimer } from '../../../views/editor/pip-timer/PipTimer';
import { getPreviewState, PreviewState } from './timerPreview.utils';

import style from './TimerPreview.module.scss';

const previewStateTag: Record<PreviewState, { label: string; variant: ComponentProps<typeof Tag>['variant'] }> = {
  onAir: { label: 'On air', variant: 'active' },
  paused: { label: 'Paused', variant: 'warning' },
  overtime: { label: 'Overtime', variant: 'danger' },
  waiting: { label: 'Waiting', variant: 'default' },
  armed: { label: 'Armed', variant: 'default' },
  stopped: { label: 'Stopped', variant: 'default' },
  blackout: { label: 'Blackout', variant: 'default' },
};

const timerTypeIcon = {
  [TimerType.CountDown]: <IoArrowDown />,
  [TimerType.CountUp]: <IoArrowUp />,
  [TimerType.Clock]: <IoTime />,
  [TimerType.None]: <IoBan />,
};

const timerTypeLabel = {
  [TimerType.CountDown]: 'Count down',
  [TimerType.CountUp]: 'Count up',
  [TimerType.Clock]: 'Clock',
  [TimerType.None]: 'No timer',
};

export default function TimerPreview() {
  const { countToEnd, timerType, playback, phase, blackout } = useMessagePreview();
  const previewState = getPreviewState(playback, phase, blackout);
  const stateTag = previewStateTag[previewState];
  // only where the dot and the tag colour agree, an idle dot is too faint over the tag
  const showMark = previewState === 'onAir' || previewState === 'paused' || previewState === 'waiting';
  const playState = getPlayState(playback, phase);
  const { data } = useViewSettings();

  return (
    <div className={style.preview}>
      <div className={style.frame}>
        <PipTimer viewSettings={data} inline />
        <CornerWithPip onExtractClick={(event) => handleLinks('timer', event)} pipElement={<PipRoot />} />
        <div className={style.tags}>
          <Tag variant={stateTag.variant} className={cx([style.tag, style.state])}>
            {showMark && <PlayStateMark state={playState} aria-hidden />}
            {stateTag.label}
          </Tag>
          {timerType && (
            // a written label rather than a tooltip, which touch screens cannot show
            <Tag className={cx([style.tag, style.timerType])}>
              {timerTypeIcon[timerType]}
              <span className={style.label}>{timerTypeLabel[timerType]}</span>
              {countToEnd && (
                <span className={style.countToEnd}>
                  <LuArrowDownToLine />
                  <span className={style.label}>to end</span>
                </span>
              )}
            </Tag>
          )}
        </div>
      </div>
    </div>
  );
}
