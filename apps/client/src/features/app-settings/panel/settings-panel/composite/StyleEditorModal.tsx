import { Suspense, lazy, useEffect, useState } from 'react';

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

export default function CodeEditorModal({ isOpen, onClose }: CodeEditorModalProps) {
  const [savedCss, setSavedCss] = useState('');
  const [draftCss, setDraftCss] = useState('');
  const [isLoadingCss, setIsLoadingCss] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = savedCss.trim() !== draftCss.trim();

  const handleRestore = async () => {
    try {
      setResetLoading(true);
      const defaultCss = await restoreCSSContents();
      setDraftCss(defaultCss);
    } catch (_error) {
      /** no error handling for now */
    } finally {
      setResetLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      await postCSSContents(draftCss);
      setSavedCss(draftCss);
    } catch (_error) {
      /** no error handling for now */
    } finally {
      setSaveLoading(false);
    }
  };

  const clear = () => setDraftCss('');

  // Load the latest CSS from the server whenever the modal opens, and ignore stale responses on close.
  useEffect(() => {
    let isCancelled = false;

    async function fetchServerCSS() {
      if (isOpen) {
        try {
          setError(null);
          setIsLoadingCss(true);
          const css = await getCSSContents();
          if (isCancelled) {
            return;
          }
          setSavedCss(css);
          setDraftCss(css);
        } catch (_error) {
          if (isCancelled) {
            return;
          }
          setSavedCss('');
          setDraftCss('');
          setError('Failed to load CSS from server');
          /** no error handling for now */
        } finally {
          if (!isCancelled) {
            setIsLoadingCss(false);
          }
        }
      }
    }
    fetchServerCSS();

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  return (
    <Modal
      title='Edit CSS override'
      size='wide'
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      showBackdrop
      bodyElements={
        <div className={style.editorBody}>
          <Suspense fallback={<Panel.Loader isLoading />}>
            <CodeEditor value={draftCss} onChange={setDraftCss} />
          </Suspense>
          <Panel.Loader isLoading={isLoadingCss} />
        </div>
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
