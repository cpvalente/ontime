import { useEffect, useState } from 'react';
import {
  Button,
  Flex,
  HStack,
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

interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CodeEditorModal(props: CodeEditorModalProps) {
  const { isOpen, onClose } = props;

  const [css, setCSS] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleReset = async () => {
    try {
      setResetLoading(true);
      const defaultCss = await restoreCSSContents();
      console.log(defaultCss);
      setCSS(defaultCss);
    } catch (_error) {
      /** no error handling for now */
    } finally {
      setResetLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      await postCSSContents(css);
    } catch (_error) {
      /** no error handling for now */
    } finally {
      setSaveLoading(false);
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
        <ModalHeader>Edit CSS</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <CodeEditor onChange={(updatedCss: string) => setCSS(updatedCss)} initialValue={css} language='css' />
        </ModalBody>

        <ModalFooter>
          <Flex alignItems='center' justifyContent='space-between' width='100%'>
            <div>
              <Button
                variant='ontime-ghosted'
                onClick={handleReset}
                isDisabled={saveLoading || resetLoading}
                isLoading={resetLoading}
              >
                Reset to default
              </Button>
            </div>
            <div>
              <HStack gap='1rem'>
                <Button variant='ontime-subtle' onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant='ontime-filled'
                  onClick={handleSave}
                  isDisabled={saveLoading || resetLoading}
                  isLoading={saveLoading}
                >
                  Save changes
                </Button>
              </HStack>
            </div>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
