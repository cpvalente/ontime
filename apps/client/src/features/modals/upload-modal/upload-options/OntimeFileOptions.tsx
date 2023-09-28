import { MutableRefObject } from 'react';
import { Switch } from '@chakra-ui/react';

import { ProjectFileImportOptions } from '../../../../common/api/ontimeApi';
import ModalSplitInput from '../../ModalSplitInput';

import style from '../UploadModal.module.scss';

interface OntimeFileOptionsProps {
  optionsRef: MutableRefObject<Partial<ProjectFileImportOptions>>;
}

export default function OntimeFileOptions(props: OntimeFileOptionsProps) {
  const { optionsRef } = props;

  const updateRef = <T extends keyof ProjectFileImportOptions>(field: T, value: ProjectFileImportOptions[T]) => {
    optionsRef.current = { ...optionsRef.current, [field]: value };
  };

  return (
    <div className={style.uploadOptions}>
      <span className={style.title}>Import options</span>
      <ModalSplitInput field='' title='Only import rundown' description='All other project options will be kept'>
        <Switch
          variant='ontime-on-light'
          onChange={(e) => {
            updateRef('onlyRundown', e.target.checked);
          }}
          defaultChecked={Boolean(optionsRef.current.onlyRundown)}
        />
      </ModalSplitInput>
    </div>
  );
}
