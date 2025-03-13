import { Button, Modal, ModalContent, ModalOverlay } from '@chakra-ui/react';
import CodeEditor from './StyleEditor';

interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
}

export default function CodeEditorModal(props: CodeEditorModalProps) {
  const { isOpen, onClose, initialValue } = props;

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent maxWidth='max(800px, 40vw)' padding='1rem'>
        <CodeEditor onChange={console.log} initialValue={initialValue} language='css' />

        <div>
          <Button variant='ontime-ghosted' onClick={onClose}>
            Cancel
          </Button>
          <Button variant='ontime-subtle' onClick={onClose}>
            Reset to default
          </Button>
          <Button variant='ontime-filled' onClick={onClose}>
            Save changes
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
