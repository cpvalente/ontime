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
import * as Panel from '../../panel-utils/PanelUtils';

import style from './StyleEditorModal.module.scss';

const CodeEditor = lazy(() => import('./StyleEditor'));

interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CSSRef {
  getCss: () => string;
}

export default function CodeEditorModal(props: CodeEditorModalProps) {
  const { isOpen, onClose } = props;

  const [css, setCSS] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const cssRef = useRef<CSSRef>(null);

  const handleRestore = async () => {
    try {
      setResetLoading(true);
      const defaultCss = await restoreCSSContents();
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
      if (cssRef.current) {
        await postCSSContents(cssRef.current.getCss());
        setIsDirty(false);
      }
    } catch (_error) {
      /** no error handling for now */
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    async function fetchServerCSS() {
      // check for isOpen to fetch recent css
      if (isOpen) {
        const css = await getCSSContents();
        setCSS(css);
      }
    }
    fetchServerCSS();
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime' isCentered>
      <ModalOverlay />
      <ModalContent maxWidth='max(800px, 40vw)' padding='1rem'>
        <ModalHeader>Edit CSS</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <CodeEditor ref={cssRef} initialValue={css} language='css' isDirty={isDirty} setIsDirty={setIsDirty} />
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
              <Panel.InlineElements>
                <Button variant='ontime-subtle' onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant='ontime-filled'
                  onClick={handleSave}
                  isDisabled={saveLoading || resetLoading || !isDirty}
                  isLoading={saveLoading}
                >
                  Save changes
                </Button>
              </Panel.InlineElements>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
