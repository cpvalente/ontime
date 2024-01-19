import { memo } from 'react';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { handleLinks } from '../../common/utils/linkUtils';

import EventEditor from './event-editor/EventEditor';
import RundownWrapper from './RundownWrapper';

import style from './RundownWrapper.module.scss';

const RundownExport = () => {
  return (
    <div className={style.rundownExport} data-testid='panel-rundown'>
      <IoArrowUp className={style.corner} onClick={(event) => handleLinks(event, 'rundown')} />
      <div className={style.rundown}>
        <ErrorBoundary>
          <RundownWrapper />
        </ErrorBoundary>
        <ErrorBoundary>
          <EventEditor />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default memo(RundownExport);
