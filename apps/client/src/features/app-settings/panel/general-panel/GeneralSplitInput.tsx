import { PropsWithChildren } from 'react';
import { FormControl } from '@chakra-ui/react';

import style from './GeneralPanel.module.scss';

interface GeneralSplitInputProps {
  field: string;
  title: string;
  description: string;
  error?: string;
}

export default function GeneralSplitInput(props: PropsWithChildren<GeneralSplitInputProps>) {
  const { field, title, description, error, children } = props;
  return (
    <FormControl className={style.splitSection}>
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
