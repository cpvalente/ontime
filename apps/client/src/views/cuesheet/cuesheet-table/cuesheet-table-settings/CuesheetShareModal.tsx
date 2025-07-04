import { useDisclosure } from '@mantine/hooks';

import Button from '../../../../common/components/buttons/Button';
import RotatedLink from '../../../../common/components/icons/RotatedLink';
import Modal from '../../../../common/components/modal/Modal';
import useInfo from '../../../../common/hooks-query/useInfo';
import useUrlPresets from '../../../../common/hooks-query/useUrlPresets';
import GenerateLinkFormExport from '../../../../features/app-settings/panel/feature-panel/GenerateLinkFormExport';

function CuesheetShareModal() {
  const { data: infoData } = useInfo();
  const { data: urlPresetData } = useUrlPresets();
  const [isOpen, handler] = useDisclosure();

  // Don't render the modal content until it's open and data is loaded
  const showModalContent = isOpen && infoData && urlPresetData;

  return (
    <>
      <Button variant='subtle' onClick={handler.open}>
        <RotatedLink />
        Share...
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={handler.close}
        title='Share cuesheet view'
        showCloseButton
        bodyElements={
          showModalContent ? <GenerateLinkFormExport lockedPath={{ value: 'cuesheet', label: 'Cuesheet' }} /> : null
        }
      />
    </>
  );
}

export default CuesheetShareModal;
