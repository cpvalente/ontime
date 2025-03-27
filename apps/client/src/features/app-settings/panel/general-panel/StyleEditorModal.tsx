import { lazy, useEffect, useRef, useState } from 'react';
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

import { getCSSContents, postCSSContents, restoreCSSContents } from '../../../../common/api/assets';

import style from './StyleEditorModal.module.scss';

const CodeEditor = lazy(() => import('./StyleEditor'));

interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CodeEditorModal(props: CodeEditorModalProps) {
  const { isOpen, onClose } = props;

  const [css, setCSS] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const cssRef = useRef<string>(css);

  const handleRestore = async () => {
    try {
      setResetLoading(true);
      const defaultCss = await restoreCSSContents();
      setCSS(defaultCss);
      cssRef.current = defaultCss;
    } catch (_error) {
      /** no error handling for now */
    } finally {
      setResetLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      await postCSSContents(cssRef.current);
      setCSS(cssRef.current);
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
      cssRef.current = css;
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
          <CodeEditor cssRef={cssRef} initialValue={css} language='css' />
        </ModalBody>

        <ModalFooter>
          <div className={style.editorActions}>
            <div>
              <Button
                variant='ontime-ghosted'
                onClick={handleRestore}
                isDisabled={saveLoading || resetLoading}
                isLoading={resetLoading}
              >
                Reset to default
              </Button>
            </div>
            <div>
              <div className={style.buttonRow}>
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
              </div>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
