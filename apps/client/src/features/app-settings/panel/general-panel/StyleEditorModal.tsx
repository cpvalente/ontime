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
import Info from '../../../../common/components/info/Info';
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
  const [error, setError] = useState<string | null>(null);

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
        setCSS(cssRef.current.getCss());
        setIsDirty(false);
      }
    } catch (_error) {
      /** no error handling for now */
    } finally {
      setSaveLoading(false);
    }
  };

  const clear = () => setCSS('');

  useEffect(() => {
    async function fetchServerCSS() {
      // check for isOpen to fetch recent css
      if (isOpen) {
        try {
          const css = await getCSSContents();
          setCSS(css);
        } catch (_error) {
          setError('Failed to load CSS from server');
          /** no error handling for now */
        }
      }
    }
    fetchServerCSS();
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime' isCentered>
      <ModalOverlay />
      <ModalContent maxWidth='max(800px, 40vw)'>
        <ModalHeader>Edit CSS override</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <CodeEditor ref={cssRef} initialValue={css} language='css' isDirty={isDirty} setIsDirty={setIsDirty} />
        </ModalBody>

        <ModalFooter className={style.column}>
          <Info>Invalid CSS will be refused by the browser</Info>
          {error && <Panel.Error className={style.right}>{`Error: ${error}`}</Panel.Error>}
          <Panel.InlineElements align='apart' className={style.editorActions}>
            <Button
              variant='ontime-ghosted'
              onClick={handleRestore}
              isDisabled={saveLoading || resetLoading}
              isLoading={resetLoading}
            >
              Reset to example
            </Button>
            <Panel.InlineElements>
              <Button variant='ontime-ghosted' onClick={clear}>
                Clear
              </Button>
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
          </Panel.InlineElements>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
