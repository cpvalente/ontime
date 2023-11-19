import { ChangeEvent, useRef, useState } from 'react';
import { Input } from '@chakra-ui/react';

import UploadEntry from './upload-entry/UploadEntry';
import { useUploadModalContextStore } from './uploadModalContext';
import { validateFile } from './uploadUtils';

import style from './UploadModal.module.scss';

export default function UploadFile() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { file, setFile, progress } = useUploadModalContextStore();

  const [errors, setErrors] = useState<string>('');

  const clearFile = () => {
    setFile(null);
    setErrors('');
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    setErrors('');

    const selectedFile = event?.target?.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    try {
      validateFile(selectedFile);
      setFile(selectedFile);
    } catch (error) {
      if (error instanceof Error) {
        setErrors(error.message);
      } else {
        setErrors('An unexpected error occurred while validating the file.');
      }
      setFile(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Input
        ref={fileInputRef}
        style={{ display: 'none' }}
        type='file'
        onChange={handleFile}
        accept='.json, .xlsx'
        data-testid='file-input'
      />
      {!file && (
        <div className={style.uploadArea} onClick={handleClick} role='button'>
          Click to select Ontime project or xlsx rundown
        </div>
      )}
      {(file || errors) && <UploadEntry file={file} errors={errors} progress={progress} handleClear={clearFile} />}
    </>
  );
}
