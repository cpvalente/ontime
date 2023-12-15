import { PropsWithChildren, useState } from 'react';
import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';
import { IoClose } from '@react-icons/all-files/io5/IoClose';

import style from './Step.module.scss';

interface StepProps {
  step: number;
  title: string;
  disabled: boolean;
  completed: boolean;
  error?: string;
}

export default function Step(props: PropsWithChildren<StepProps>) {
  const { step, title, disabled, completed, error, children } = props;
  const [collapsed, setCollapsed] = useState(disabled);

  const handleCollapse = () => setCollapsed((prev) => !prev);

  return (
    <div className={style.wrapper}>
      <div className={style.header} onClick={handleCollapse}>
        <span className={style.step}>{step}</span>
        <span className={style.title}>{title}</span>
        {completed && <IoCheckmark className={style.check} />}
        {error && <IoClose className={style.errorIcon} />}
      </div>
      {!collapsed && (
        <>
          {error && <div className={style.errorText}>{error}</div>}
          {children}
        </>
      )}
    </div>
  );
}
