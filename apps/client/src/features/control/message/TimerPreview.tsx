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
    <div className={style.stage}>
      <PipTimer viewSettings={data} />
      <div className={style.stageChrome}>
        <TimerStatus />
        <CornerWithPip onExtractClick={(event) => handleLinks('timer', event)} pipElement={<PipRoot />} />
      </div>
    </div>
  );
}
