import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';

import styles from './ExportModal.module.scss';

export type ExportType = 'csv' | 'json';
interface ExportModalProps {
  isOpen: boolean;
  onClose: (type?: ExportType) => void;
  buttonVariants: {
    csv: string;
    json: string;
  };
}

export default function ExportModal(props: ExportModalProps) {
  const { isOpen, onClose, buttonVariants } = props;

  return (
    <Modal isOpen={isOpen} onClose={onClose} motionPreset='scale' size='xl' colorScheme='blackAlpha'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className={styles.modalHeader}>Download options</ModalHeader>
        <ModalCloseButton />
        <ModalBody className={styles.modalBody}>
          <Button onClick={() => onClose('csv')} variant={buttonVariants.csv} width='48%'>
            rundown as CSV
          </Button>
          <Button onClick={() => onClose('json')} variant={buttonVariants.json} width='48%'>
            Project file
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
