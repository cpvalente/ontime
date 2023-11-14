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
    <Modal isOpen={isOpen} onClose={onClose} motionPreset='slideInBottom' size='xl' variant='ontime-small'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className={styles.modalHeader}>Download options</ModalHeader>
        <ModalCloseButton />
        <ModalBody className={styles.buttonRow}>
          <Button onClick={() => onClose('csv')} variant='ontime-subtle-on-light' width='100%'>
            Rundown as CSV
          </Button>
          <Button onClick={() => onClose('json')} variant='ontime-filled' width='100%'>
            Project file
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
