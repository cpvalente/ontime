import { ChangeEvent, useRef, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';

interface SheetsModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function SheetsModal(props: SheetsModalProps) {
  const { isOpen, onClose } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleClose = () => onClose();
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event?.target?.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleAuthenticate = () => {}
  const handlePullData = () => {}

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen}
      closeOnOverlayClick={false}
      motionPreset='slideInBottom'
      size='xl'
      scrollBehavior='inside'
      preserveScrollBarGap
      variant='ontime-upload'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Sheets!</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input
            ref={fileInputRef}
            style={{ display: 'none' }}
            type='file'
            onChange={handleFile}
            accept='.json'
            data-testid='file-input'
          />
          <div>Need to add some help here</div>
          <div>
            <Button onClick={handleClick}>Upload Token</Button>
          </div>
          {file && <div>We got a file</div>}
          <div>You are authenticated</div>
          <div>
            <Button variant='ontime-filled' padding='0 2em' onClick={handlePullData}>
              Pull data
            </Button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant='ontime-ghost-on-light'>Reset</Button>
          <Button variant='ontime-filled' padding='0 2em' onClick={handleAuthenticate}>
            Authenticate
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
