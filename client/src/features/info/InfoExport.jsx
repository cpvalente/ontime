import { Box } from '@chakra-ui/react';
import { FiArrowUpRight } from '@react-icons/all-files/fi/FiArrowUpRight';

import ErrorBoundary from '../../common/components/errorBoundary/ErrorBoundary';
import { handleLinks } from '../../common/utils/linkUtils';

import Info from './Info';

import style from '../editors/Editor.module.scss';

export default function InfoExport() {
  return (
    <Box className={style.info}>
      <FiArrowUpRight className={style.corner} onClick={(event) => handleLinks(event, 'info')} />
      <div className={style.content}>
        <ErrorBoundary>
          <Info />
        </ErrorBoundary>
      </div>
    </Box>
  );
}
