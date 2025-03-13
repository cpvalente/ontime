import { Button, Modal, ModalContent, ModalOverlay } from '@chakra-ui/react';
import { getCSSContents } from '../../../../common/api/db';
import CodeEditor from './StyleEditor';
import { useEffect, useState } from 'react';

interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CodeEditorModal(props: CodeEditorModalProps) {
  const { isOpen, onClose } = props;

  const [css, setCSS] = useState('');

  useEffect(() => {
    async function fetchServerCSS() {
      const css = await getCSSContents();
      setCSS(css);
    }
    fetchServerCSS();
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent maxWidth='max(800px, 40vw)' padding='1rem'>
        <CodeEditor onChange={console.log} initialValue={css} language='css' />

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
