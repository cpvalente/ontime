import { Suspense, lazy, useEffect, useRef, useState } from 'react';

import { getCSSContents, getCSSExample, postCSSContents } from '../../../../../common/api/assets';
import { maybeAxiosError } from '../../../../../common/api/utils';
import Button from '../../../../../common/components/buttons/Button';
import Dialog from '../../../../../common/components/dialog/Dialog';
import Info from '../../../../../common/components/info/Info';
import Modal from '../../../../../common/components/modal/Modal';
import useViewSettings from '../../../../../common/hooks-query/useViewSettings';
import * as Panel from '../../../panel-utils/PanelUtils';

import style from './StyleEditorModal.module.scss';

const CodeEditor = lazy(() => import('./StyleEditor'));

interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CodeEditorModal({ isOpen, onClose }: CodeEditorModalProps) {
  const { data: viewSettings, status: viewSettingsStatus, mutateAsync: saveViewSettings } = useViewSettings();
  const [savedCss, setSavedCss] = useState('');
  const [draftCss, setDraftCss] = useState('');
  const [cssLoadStatus, setCssLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [saveLoading, setSaveLoading] = useState(false);
  const [exampleLoading, setExampleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const exampleRequestId = useRef(0);

  const isDirty = savedCss.trim() !== draftCss.trim();
  const isOverrideEnabled = viewSettings.overrideStyles;

  const handleLoadExample = async () => {
    const requestId = ++exampleRequestId.current;
    try {
      setError(null);
      setExampleLoading(true);
      const defaultCss = await getCSSExample();
      if (requestId !== exampleRequestId.current) {
        return;
      }
      setDraftCss(defaultCss);
    } catch (exampleError) {
      if (requestId === exampleRequestId.current) {
        setError(maybeAxiosError(exampleError));
      }
    } finally {
      if (requestId === exampleRequestId.current) {
        setExampleLoading(false);
      }
    }
  };

  const handleDraftChange = (css: string) => {
    exampleRequestId.current++;
    setExampleLoading(false);
    setDraftCss(css);
  };

  const handleSave = async () => {
    if (viewSettingsStatus !== 'success' || cssLoadStatus !== 'success') {
      return;
    }

    try {
      setError(null);
      setSaveLoading(true);
      await postCSSContents(draftCss);
      setSavedCss(draftCss);
      // saving CSS signals intent to see it, so we enable the override
      if (!isOverrideEnabled) {
        await saveViewSettings({ ...viewSettings, overrideStyles: true });
      }
    } catch (saveError) {
      setError(maybeAxiosError(saveError));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleClose = () => {
    if (saveLoading) {
      return;
    }
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    exampleRequestId.current++;
    onClose();
  };

  const handleDiscard = () => {
    exampleRequestId.current++;
    setConfirmDiscard(false);
    onClose();
  };

  // Load the latest CSS from the server whenever the modal opens, and ignore stale responses on close.
  useEffect(() => {
    let isCancelled = false;

    async function fetchServerCSS() {
      if (isOpen) {
        try {
          setError(null);
          setExampleLoading(false);
          setCssLoadStatus('loading');
          const css = await getCSSContents();
          if (isCancelled) {
            return;
          }
          setSavedCss(css);
          setDraftCss(css);
          setCssLoadStatus('success');
        } catch (_error) {
          if (isCancelled) {
            return;
          }
          setSavedCss('');
          setDraftCss('');
          setCssLoadStatus('error');
          setError('Failed to load CSS from server');
        }
      }
    }
    fetchServerCSS();

    return () => {
      isCancelled = true;
      exampleRequestId.current++;
    };
  }, [isOpen]);

  return (
    <>
      <Modal
        title='Edit CSS override'
        isOpen={isOpen}
        onClose={handleClose}
        showCloseButton
        showBackdrop
        bodyElements={
          <div className={style.editorBody}>
            <Suspense fallback={<Panel.Loader isLoading />}>
              <CodeEditor value={draftCss} onChange={handleDraftChange} />
            </Suspense>
            <Panel.Loader isLoading={cssLoadStatus === 'loading'} />
          </div>
        }
        footerElements={
          <div className={style.column}>
            {isOverrideEnabled ? (
              <Info>
                Saved changes apply immediately to all open views. Keep a view open to see your changes as you work.
                <br />
                Invalid CSS will be refused by the browser.
              </Info>
            ) : (
              <Info type='warning'>
                CSS override is OFF, views do not use this stylesheet. Saving will turn the override on.
              </Info>
            )}
            {error && <Panel.Error className={style.right}>{`Error: ${error}`}</Panel.Error>}
            <Panel.InlineElements align='apart' className={style.editorActions}>
              <Button
                variant='ghosted'
                onClick={handleLoadExample}
                disabled={saveLoading || exampleLoading || cssLoadStatus === 'loading'}
                loading={exampleLoading}
              >
                Load example CSS
              </Button>
              <Panel.InlineElements>
                <Button onClick={handleClose} disabled={saveLoading}>
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  onClick={handleSave}
                  disabled={
                    viewSettingsStatus !== 'success' ||
                    cssLoadStatus !== 'success' ||
                    saveLoading ||
                    exampleLoading ||
                    (!isDirty && isOverrideEnabled)
                  }
                  loading={saveLoading}
                >
                  {isOverrideEnabled ? 'Save changes' : 'Save and enable'}
                </Button>
              </Panel.InlineElements>
            </Panel.InlineElements>
          </div>
        }
      />
      <Dialog
        isOpen={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title='Discard changes'
        showBackdrop
        showCloseButton
        bodyElements='You have unsaved changes to the CSS override. Close the editor and discard them?'
        footerElements={
          <>
            <Button size='large' onClick={() => setConfirmDiscard(false)}>
              Cancel
            </Button>
            <Button variant='destructive' size='large' onClick={handleDiscard}>
              Discard changes
            </Button>
          </>
        }
      />
    </>
  );
}
