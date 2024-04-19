import { memo } from 'react';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { handleLinks } from '../../common/utils/linkUtils';
import { cx } from '../../common/utils/styleUtils';
import RundownWrapper from './RundownWrapper';

import style from './RundownExport.module.scss';
import EventEditorWrapper from './event-editor/EventEditorWrapper';

const RundownExport = () => {
  const isExtracted = window.location.pathname.includes('/rundown');

  const classes = cx([style.rundownExport, isExtracted && style.extracted]);

  return (
    <div className={classes} data-testid='panel-rundown'>
      <div className={style.rundown}>
        <div className={style.list}>
          <ErrorBoundary>
            {!isExtracted && <IoArrowUp className={style.corner} onClick={(event) => handleLinks(event, 'rundown')} />}
            <RundownWrapper />
          </ErrorBoundary>
        </div>
        <div className={style.side}>
          <ErrorBoundary>
            <EventEditorWrapper />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default memo(RundownExport);
