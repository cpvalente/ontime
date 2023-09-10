import { MutableRefObject } from 'react';
import { Switch } from '@chakra-ui/react';

import ModalSplitInput from '../../ModalSplitInput';
import { OntimeInputOptions } from '../UploadModal';

import style from '../UploadModal.module.scss';

interface OntimeFileOptionsProps {
  optionsRef: MutableRefObject<OntimeInputOptions>;
}

export default function OntimeFileOptions(props: OntimeFileOptionsProps) {
  const { optionsRef } = props;

  const updateRef = <T extends keyof OntimeInputOptions>(field: T, value: OntimeInputOptions[T]) => {
    optionsRef.current = { ...optionsRef.current, [field]: value };
  };

  return (
    <div className={style.uploadOptions}>
      <span className={style.title}>Import options</span>
      <ModalSplitInput
        field=''
        title='Only import rundown'
        description='All other options, including application settings will be discarded'
      >
        <Switch
          variant='ontime-on-light'
          onChange={(e) => {
            updateRef('onlyImportRundown', e.target.checked);
          }}
        />
      </ModalSplitInput>
    </div>
  );
}
