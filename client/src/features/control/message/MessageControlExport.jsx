import { Box } from '@chakra-ui/react';
import { FiArrowUpRight } from '@react-icons/all-files/fi/FiArrowUpRight';

import ErrorBoundary from '../../../common/components/errorBoundary/ErrorBoundary';
import { handleLinks } from '../../../common/utils/linkUtils';

import MessageControl from './MessageControl';

import style from '../../editors/Editor.module.scss';

export default function MessageControlExport() {
  return (
    <Box className={style.messages} data-testid="panel-messages-control">
      <FiArrowUpRight className={style.corner} onClick={(event) => handleLinks(event, 'messagecontrol')} />
      <div className={style.content}>
        <ErrorBoundary>
          <MessageControl />
        </ErrorBoundary>
      </div>
    </Box>
  );
}
