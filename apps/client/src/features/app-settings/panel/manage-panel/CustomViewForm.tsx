import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import { IoCloudUploadOutline } from 'react-icons/io5';

import { uploadCustomView } from '../../../../common/api/customViews';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import * as Panel from '../../panel-utils/PanelUtils';
import { getFileError, getSlugError, getViewUrl, maxUploadLabel } from './customViews.utils';

import style from './CustomViews.module.scss';

interface CustomViewFormProps {
  onComplete: () => void;
  onClose: () => void;
}

export default function CustomViewForm({ onComplete, onClose }: CustomViewFormProps) {
  const [slug, setSlug] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [slugDirty, setSlugDirty] = useState(false);
  const [fileDirty, setFileDirty] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const normalisedSlug = useMemo(() => slug.trim().toLowerCase(), [slug]);
  const previewUrl = getViewUrl(normalisedSlug);
  const slugError = useMemo(() => getSlugError(normalisedSlug), [normalisedSlug]);
  const fileError = useMemo(() => getFileError(selectedFile), [selectedFile]);
  const canUpload = Boolean(normalisedSlug && selectedFile) && !slugError && !fileError && !isUploading;

  const handleSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
    setFileDirty(true);
    setError(null);
  };

  const handleUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile || slugError || fileError) return;

    try {
      setIsUploading(true);
      setError(null);
      await uploadCustomView(normalisedSlug, selectedFile);
      onComplete();
    } catch (err) {
      setError(maybeAxiosError(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Panel.Indent as='form' onSubmit={handleUpload} className={style.uploadForm}>
      <input
        ref={fileInputRef}
        style={{ display: 'none' }}
        type='file'
        onChange={handleSelectFile}
        accept='.html,text/html'
      />

      <div className={style.step}>
        <div className={style.stepTitle}>1. Choose a name</div>
        <Panel.Description>Name</Panel.Description>
        <Input
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugDirty(true);
          }}
          placeholder='my-view'
          aria-label='Custom view name'
          autoCapitalize='off'
          autoComplete='off'
          fluid
        />
        <Panel.Description>
          Use lowercase letters, numbers, and dashes. Example: <Panel.Highlight>my-view</Panel.Highlight>
        </Panel.Description>
        <Panel.Description>
          Preview URL: <Panel.Highlight>{previewUrl}</Panel.Highlight>
        </Panel.Description>
        {slugDirty && slugError && <Panel.Error>{slugError}</Panel.Error>}
      </div>

      <div className={style.step}>
        <div className={style.stepTitle}>2. Select index.html</div>
        <Panel.Description>Upload file</Panel.Description>
        <Panel.InlineElements wrap='wrap' className={style.filePicker}>
          <Button onClick={() => fileInputRef.current?.click()}>
            {selectedFile ? 'Replace index.html' : 'Choose index.html'}
          </Button>
          <span className={style.fileName}>
            {selectedFile ? `${selectedFile.name} (${Math.ceil(selectedFile.size / 1024)} KB)` : 'No file selected'}
          </span>
        </Panel.InlineElements>
        <Panel.Description>Accepted: index.html only, maximum {maxUploadLabel}.</Panel.Description>
        {fileDirty && fileError && <Panel.Error>{fileError}</Panel.Error>}
      </div>

      {error && <Panel.Error>{error}</Panel.Error>}

      <Panel.InlineElements align='end'>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='primary' type='submit' loading={isUploading} disabled={!canUpload}>
          Upload view <IoCloudUploadOutline />
        </Button>
      </Panel.InlineElements>
    </Panel.Indent>
  );
}
