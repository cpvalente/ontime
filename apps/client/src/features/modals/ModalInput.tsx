import { PropsWithChildren } from 'react';
import { FormControl } from '@chakra-ui/react';

import style from './settings-modal/SettingsModal.module.scss';

interface ModalInputProps {
  field: string;
  title: string;
  description: string;
  error?: string;
}

export default function ModalInput(props: PropsWithChildren<ModalInputProps>) {
  const { field, title, description, error, children } = props;

  return (
    <FormControl isInvalid={!!error} className={style.columnSection}>
      <label htmlFor={field}>
        <span className={style.sectionTitle}>{title}</span>
        {error ? (
          <span className={style.error}>{error}</span>
        ) : (
          <span className={style.sectionSubtitle}>{description}</span>
        )}
      </label>
      {children}
    </FormControl>
  );
}
