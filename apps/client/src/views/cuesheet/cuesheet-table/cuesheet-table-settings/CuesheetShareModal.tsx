import { Toolbar } from '@base-ui/react/toolbar';
import { useDisclosure } from '@mantine/hooks';
import { OntimeView } from 'ontime-types';

import Button from '../../../../common/components/buttons/Button';
import RotatedLink from '../../../../common/components/icons/RotatedLink';
import Modal from '../../../../common/components/modal/Modal';
import useInfo from '../../../../common/hooks-query/useInfo';
import useUrlPresets from '../../../../common/hooks-query/useUrlPresets';
import GenerateLinkFormExport from '../../../../features/sharing/GenerateLinkFormExport';

function CuesheetShareModal() {
  const { data: infoData } = useInfo();
  const { data: urlPresetData } = useUrlPresets();
  const [isOpen, handler] = useDisclosure();

  // Don't render the modal content until it's open and data is loaded
  const showModalContent = isOpen && infoData && urlPresetData;

  return (
    <>
      <Toolbar.Button onClick={handler.open} render={<Button />}>
        <RotatedLink />
        Share...
      </Toolbar.Button>
      <Modal
        isOpen={isOpen}
        onClose={handler.close}
        title='Share cuesheet view'
        showBackdrop
        showCloseButton
        bodyElements={
          showModalContent ? (
            <GenerateLinkFormExport lockedPath={{ value: OntimeView.Cuesheet, label: 'Cuesheet' }} />
          ) : null
        }
      />
    </>
  );
}

export default CuesheetShareModal;
