import React from 'react';
import { Box } from '@chakra-ui/layout';
import { FiArrowUpRight } from '@react-icons/all-files/fi/FiArrowUpRight';
import ErrorBoundary from '../../common/components/errorBoundary/ErrorBoundary';
import Info from './Info';
import style from '../editors/Editor.module.scss';
import { handleLinks } from '../../common/utils/linkUtils';

export default function InfoExport() {
  return (
    <Box className={style.info}>
      <h1>Info</h1>
      <FiArrowUpRight className={style.corner} onClick={(event) => handleLinks(event, 'info')} />
      <div className={style.content}>
        <ErrorBoundary>
          <Info />
        </ErrorBoundary>
      </div>
    </Box>
  );
}
