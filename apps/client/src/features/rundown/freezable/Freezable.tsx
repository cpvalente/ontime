import { useFrozen } from '../../../common/hooks/useSocket';

import style from './Freezable.module.scss';

interface FreezableProps {
  children: JSX.Element;
}

export default function Freezable({ children }: FreezableProps) {
  const { frozen } = useFrozen();

  if (frozen) {
    return <div className={style.frozen}>{children}</div>;
  }

  return children;
}
