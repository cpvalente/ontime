import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { getCSSContents, postCSSContents, restoreCSSContents } from '../../../../common/api/db';
import CodeEditor from './StyleEditor';
import { useEffect, useState } from 'react';

interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CodeEditorModal(props: CodeEditorModalProps) {
  const { isOpen, onClose } = props;

  const [css, setCSS] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    try {
      setLoading(true);
      const defaultCss = await restoreCSSContents();
      console.log(defaultCss);
      setCSS(defaultCss);
      setLoading(false);
    } catch (_error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await postCSSContents(css);
      setLoading(false);
    } catch (_error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchServerCSS() {
      const css = await getCSSContents();
      setCSS(css);
    }
    fetchServerCSS();
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime' isCentered>
      <ModalOverlay />
      <ModalContent maxWidth='max(800px, 40vw)' padding='1rem'>
        <ModalHeader>Customise CSS</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <CodeEditor onChange={(updatedCss: string) => setCSS(updatedCss)} initialValue={css} language='css' />
        </ModalBody>

        <ModalFooter>
          <Button variant='ontime-subtle' isDisabled={loading} onClick={handleReset}>
            Reset to default
          </Button>
          <Button variant='ontime-filled' isDisabled={loading} onClick={handleSave}>
            Save changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
