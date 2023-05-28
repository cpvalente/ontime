import { PropsWithChildren } from 'react';
import { Modal, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';

import { ModalContextProvider } from '../../common/context/ModalContext';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: string;
}

export default function ModalWrapper(props: PropsWithChildren<ModalWrapperProps>) {
  const { isOpen, onClose, title, size = 'xl', children } = props;
  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      closeOnOverlayClick={false}
      motionPreset='slideInBottom'
      size={size}
      scrollBehavior='inside'
      preserveScrollBarGap
      variant='ontime'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalContextProvider>{children}</ModalContextProvider>
      </ModalContent>
    </Modal>
  );
}
