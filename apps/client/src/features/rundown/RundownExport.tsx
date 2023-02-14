import { Box } from '@chakra-ui/react';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { CursorProvider } from '../../common/context/CursorContext';
import { handleLinks } from '../../common/utils/linkUtils';

import RundownWrapper from './RundownWrapper';

import style from '../editors/Editor.module.scss';

export default function RundownExport() {
  return (
    <CursorProvider>
      <Box className={style.editor} data-testid='panel-rundown'>
        <IoArrowUp
          className={style.corner}
          onClick={(event) => handleLinks(event, 'rundown')}
        />
        <ErrorBoundary>
          <RundownWrapper />
        </ErrorBoundary>
      </Box>
    </CursorProvider>
  );
}
