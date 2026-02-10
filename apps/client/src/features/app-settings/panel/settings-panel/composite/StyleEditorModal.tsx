import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { getCSSContents, postCSSContents, restoreCSSContents } from '../../../../../common/api/assets';
import Button from '../../../../../common/components/buttons/Button';
import Info from '../../../../../common/components/info/Info';
import Modal from '../../../../../common/components/modal/Modal';
import * as Panel from '../../../panel-utils/PanelUtils';

import style from './StyleEditorModal.module.scss';

const CodeEditor = lazy(() => import('./StyleEditor'));

interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CSSRef {
  getCss: () => string;
}

export default function CodeEditorModal({ isOpen, onClose }: CodeEditorModalProps) {
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
    <Modal
      title='Edit CSS override'
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      showBackdrop
      bodyElements={
        <Suspense fallback={null}>
          <CodeEditor ref={cssRef} initialValue={css} language='css' isDirty={isDirty} setIsDirty={setIsDirty} />
        </Suspense>
      }
      footerElements={
        <div className={style.column}>
          <Info>Invalid CSS will be refused by the browser</Info>
          {error && <Panel.Error className={style.right}>{`Error: ${error}`}</Panel.Error>}
          <Panel.InlineElements align='apart' className={style.editorActions}>
            <Button variant='ghosted' size='large' onClick={handleRestore} disabled={saveLoading || resetLoading}>
              Reset to example
            </Button>
            <Panel.InlineElements>
              <Button variant='ghosted' size='large' onClick={clear}>
                Clear
              </Button>
              <Button size='large' onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant='primary'
                size='large'
                onClick={handleSave}
                disabled={saveLoading || resetLoading || !isDirty}
                loading={saveLoading}
              >
                Save changes
              </Button>
            </Panel.InlineElements>
          </Panel.InlineElements>
        </div>
      }
    />
  );
}
