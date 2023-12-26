import { ChangeEvent, useRef, useState } from 'react';
import { Input } from '@chakra-ui/react';

import { isKeyEnter } from '../../../../../common/utils/keyEvent';

import { validateFile } from './utils';

import style from './Upload.module.scss';

interface UploadAreaProps {
  setFile: (file: File | null) => void;
}

export default function UploadArea(props: UploadAreaProps) {
  const { setFile } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string>('');

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
      <div
        className={style.uploadArea}
        onClick={handleClick}
        onKeyDown={(event) => isKeyEnter(event) && handleClick()}
        role='button'
        tabIndex={0}
      >
        <div className={style.main}>Click to upload a new Project file or Rundown</div>
        <div className={style.secondary}>JSON and XLSX file extensions accepted</div>
      </div>
      {errors && <div className={style.error}>{errors}</div>}
    </>
  );
}
