import { memo } from 'react';

import ErrorBoundary from '../../../common/components/error-boundary/ErrorBoundary';
import { handleLinks } from '../../../common/utils/linkUtils';
import { cx } from '../../../common/utils/styleUtils';
import { Corner } from '../../editors/editor-utils/EditorUtils';

import MessageControl from './MessageControl';

import style from '../../editors/Editor.module.scss';

const MessageControlExport = () => {
  const isExtracted = window.location.pathname.includes('/messagecontrol');
  const classes = cx([style.content, style.contentColumnLayout]);

  return (
    <div className={style.messages} data-testid='panel-messages-control'>
      {!isExtracted && <Corner onClick={(event) => handleLinks(event, 'messagecontrol')} />}
      <div className={classes}>
        <ErrorBoundary>
          <MessageControl />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default memo(MessageControlExport);
