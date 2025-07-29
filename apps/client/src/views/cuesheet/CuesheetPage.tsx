import { IoApps } from 'react-icons/io5';
import { useDisclosure } from '@mantine/hooks';

import IconButton from '../../common/components/buttons/IconButton';
import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { getIsViewLocked } from '../../externals';
import CuesheetOverview from '../../features/overview/CuesheetOverview';

import CuesheetEditModal from './cuesheet-edit-modal/CuesheetEditModal';
import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import CuesheetTableWrapper from './CuesheetTableWrapper';

import styles from './CuesheetPage.module.scss';

export default function CuesheetPage() {
  const [isMenuOpen, menuHandler] = useDisclosure();

  useWindowTitle('Cuesheet');

  const isLocked = getIsViewLocked();

  return (
    <>
      <NavigationMenu isOpen={isMenuOpen} onClose={menuHandler.close} />
      <CuesheetEditModal />
      <div className={styles.tableWrapper} data-testid='cuesheet'>
        <CuesheetOverview>
          {!isLocked && (
            <IconButton aria-label='Toggle navigation' variant='subtle-white' size='xlarge' onClick={menuHandler.open}>
              <IoApps />
            </IconButton>
          )}
        </CuesheetOverview>
        <CuesheetProgress />
        <CuesheetTableWrapper />
      </div>
    </>
  );
}
