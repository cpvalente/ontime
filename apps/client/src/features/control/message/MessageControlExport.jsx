import { memo } from 'react';
import { Box } from '@chakra-ui/react';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';

import ErrorBoundary from '../../../common/components/error-boundary/ErrorBoundary';
import { handleLinks } from '../../../common/utils/linkUtils';

import MessageControl from './MessageControl';

import style from '../../editors/Editor.module.scss';

const MessageControlExport = () => {
  return (
    <Box className={style.messages} data-testid='panel-messages-control'>
      <IoArrowUp className={style.corner} onClick={(event) => handleLinks(event, 'messagecontrol')} />
      <div className={style.content}>
        <ErrorBoundary>
          <MessageControl />
        </ErrorBoundary>
      </div>
    </Box>
  );
};

export default memo(MessageControlExport);
