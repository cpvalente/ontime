import { PropsWithChildren, useEffect, useState } from 'react';
import { IoCheckmarkCircle } from '@react-icons/all-files/io5/IoCheckmarkCircle';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { IoRadioButtonOffOutline } from '@react-icons/all-files/io5/IoRadioButtonOffOutline';

import style from './Step.module.scss';

interface StepProps {
  title: string;
  disabled: boolean;
  completed: boolean;
  error?: string;
}

export default function Step(props: PropsWithChildren<StepProps>) {
  const { title, disabled, completed, error, children } = props;
  const [collapsed, setCollapsed] = useState(disabled);
  
  const handleCollapse = () => setCollapsed((prev) => !prev);

  useEffect(() => {
    if (completed) {
      setCollapsed(true);
    }
  }, [completed]);

  return (
    <div className={style.wrapper}>
      <div className={style.header} onClick={handleCollapse}>
        {completed ? <IoCheckmarkCircle className={style.step} /> : <IoRadioButtonOffOutline className={style.step} />}
        <span className={style.title}>{title}</span>
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
