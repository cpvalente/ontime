import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { IoCheckmarkCircle } from '@react-icons/all-files/io5/IoCheckmarkCircle';
import { IoCloseCircle } from '@react-icons/all-files/io5/IoCloseCircle';
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

  const icon = useMemo(() => {
    if (completed) return <IoCheckmarkCircle className={style.step} style={{ color: 'green' }} />;
    if (error) return <IoCloseCircle className={style.step} style={{ color: 'red' }} />;
    return <IoRadioButtonOffOutline className={style.step} />;
  }, [completed, error]);

  useEffect(() => {
    if (completed) {
      setCollapsed(true);
    }
  }, [completed]);

  return (
    <div className={style.wrapper}>
      <div className={style.header} onClick={handleCollapse}>
        {icon}
        <span className={style.title}>{title}</span>
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
