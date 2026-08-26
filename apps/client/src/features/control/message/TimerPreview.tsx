import { CornerWithPip } from '../../../common/components/editor-utils/EditorUtils';
import useViewSettings from '../../../common/hooks-query/useViewSettings';
import { handleLinks } from '../../../common/utils/linkUtils';
import PipRoot from '../../../views/editor/pip-timer/PipRoot';
import { PipTimer } from '../../../views/editor/pip-timer/PipTimer';
import TimerStatus from './TimerStatus';

import style from './TimerPreview.module.scss';

export default function TimerPreview() {
  const { data } = useViewSettings();

  return (
    <div className={style.preview}>
      <div className={style.stage}>
        <div className={style.stageFrame}>
          <PipTimer viewSettings={data} />
          <div className={style.stageCorners}>
            <CornerWithPip onExtractClick={(event) => handleLinks('timer', event)} pipElement={<PipRoot />} />
          </div>
        </div>
      </div>
      <TimerStatus />
    </div>
  );
}
