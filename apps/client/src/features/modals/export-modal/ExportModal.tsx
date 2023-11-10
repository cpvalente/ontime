import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';

import styles from './ExportModal.module.scss';

export type ExportType = 'csv' | 'json';

interface ExportModalProps {
  isOpen: boolean;
  onClose: (type?: ExportType) => void;
}

export default function ExportModal(props: ExportModalProps) {
  const { isOpen, onClose } = props;

  return (
    <Modal isOpen={isOpen} onClose={onClose} motionPreset='scale' size='xl' colorScheme='blackAlpha'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className={styles.modalHeader}>Download options</ModalHeader>
        <ModalCloseButton />
        <ModalBody className={styles.modalBody}>
          <Button onClick={() => onClose('csv')} variant='ontime-subtle-on-light' width='48%'>
            Rundown as CSV
          </Button>
          <Button onClick={() => onClose('json')} variant='ontime-filled' width='48%'>
            Project file
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
