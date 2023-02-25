import { PropsWithChildren } from 'react';
import {
  Button,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import styles from './Modal.module.scss';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export default function ModalWrapper(props: PropsWithChildren<ModalWrapperProps>) {
  const { isOpen, onClose, title, children } = props;

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      closeOnOverlayClick={false}
      motionPreset='slideInBottom'
      size='xl'
      scrollBehavior='inside'
      preserveScrollBarGap
      variant='ontime'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        {children}
      </ModalContent>
    </Modal>
  );
}
