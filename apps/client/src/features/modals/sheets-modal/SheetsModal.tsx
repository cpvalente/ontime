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
import { getSheetsAuthStatus, getSheetsAuthUrl, uploadSheetClientFile } from '../../../common/api/ontimeApi';

interface SheetsModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function SheetsModal(props: SheetsModalProps) {
  const { isOpen, onClose } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [authState, setAuthState] = useState<boolean>(true);

  const handleClose = () => onClose();
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event?.target?.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    } else {
      uploadSheetClientFile(selectedFile);
    }
    setFile(selectedFile);
  };

  //TODO: do smoething better here
  getSheetsAuthStatus().then((data) => {
    setAuthState(data);
  });

  const handleAuthenticate = () => {
    getSheetsAuthUrl().then((data) => {
      console.log(data);
      if (data == 'bad') {
      } else {
        window.open(data, '_blank', 'noreferrer');
      }
    });
  };
  const handlePullData = () => {};

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
            <Button onClick={handleClick}>Upload Client Secrect</Button>
          </div>
          {authState && <div>You are authenticated</div>}
          {!authState && <div>You are not authenticated</div>}
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
