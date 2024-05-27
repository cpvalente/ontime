import { memo } from 'react';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';

import { ContextMenu } from '../../common/components/context-menu/ContextMenu';
import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { handleLinks } from '../../common/utils/linkUtils';
import { cx } from '../../common/utils/styleUtils';

import EventEditor from './event-editor/EventEditor';
import RundownWrapper from './RundownWrapper';

import style from './RundownExport.module.scss';

const RundownExport = () => {
  const isExtracted = window.location.pathname.includes('/rundown');

  const classes = cx([style.rundownExport, isExtracted && style.extracted]);

  return (
    <div className={classes} data-testid='panel-rundown'>
      <div className={style.rundown}>
        <div className={style.list}>
          <ErrorBoundary>
            {!isExtracted && <IoArrowUp className={style.corner} onClick={(event) => handleLinks(event, 'rundown')} />}
            <ContextMenu>
              <RundownWrapper />
            </ContextMenu>
          </ErrorBoundary>
        </div>
        <div className={style.side}>
          <ErrorBoundary>
            <EventEditor />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default memo(RundownExport);
