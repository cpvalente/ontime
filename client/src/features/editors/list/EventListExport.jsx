import { Box } from '@chakra-ui/layout';
import { FiArrowUpRight } from '@react-icons/all-files/fi/FiArrowUpRight';

import ErrorBoundary from '../../../common/components/errorBoundary/ErrorBoundary';
import { CollapseProvider } from '../../../common/context/CollapseContext';
import { CursorProvider } from '../../../common/context/CursorContext';
import { handleLinks } from '../../../common/utils/linkUtils';

import EventListWrapper from './EventListWrapper';

import style from '../Editor.module.scss';

export default function EventListExport() {
  return (
    <CursorProvider>
      <CollapseProvider>
        <Box className={style.editor}>
          <h1>Event List</h1>
          <FiArrowUpRight
            className={style.corner}
            onClick={(event) => handleLinks(event, 'eventlist')}
          />
          <ErrorBoundary>
            <EventListWrapper />
          </ErrorBoundary>
        </Box>
      </CollapseProvider>
    </CursorProvider>
  );
}
