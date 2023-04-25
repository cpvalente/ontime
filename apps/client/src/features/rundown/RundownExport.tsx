import { memo } from 'react';
import { Box } from '@chakra-ui/react';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { handleLinks } from '../../common/utils/linkUtils';

import RundownWrapper from './RundownWrapper';

import style from '../editors/Editor.module.scss';

const RundownExport = () => {
  return (
    <Box className={style.rundown} data-testid='panel-rundown'>
      <IoArrowUp className={style.corner} onClick={(event) => handleLinks(event, 'rundown')} />
      <ErrorBoundary>
        <RundownWrapper />
      </ErrorBoundary>
    </Box>
  );
};

export default memo(RundownExport);
