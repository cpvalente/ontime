import { Box } from '@chakra-ui/react';
import { FiArrowUpRight } from '@react-icons/all-files/fi/FiArrowUpRight';
import ErrorBoundary from 'common/components/errorBoundary/ErrorBoundary';
import { CursorProvider } from 'common/context/CursorContext';
import { handleLinks } from 'common/utils/linkUtils';

import RundownWrapper from './RundownWrapper';

import style from '../editors/Editor.module.scss';

export default function RundownExport() {
  return (
    <CursorProvider>
      <Box className={style.editor} data-testid="panel-event-list">
        <FiArrowUpRight
          className={style.corner}
          onClick={(event) => handleLinks(event, 'eventlist')}
        />
        <ErrorBoundary>
          <RundownWrapper />
        </ErrorBoundary>
      </Box>
    </CursorProvider>
  );
}
