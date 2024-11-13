import { ReactElement } from 'react';
import { IoSnowSharp } from '@react-icons/all-files/io5/IoSnowSharp';

import { useFrozen } from '../../../common/hooks/useSocket';

import style from './Freezable.module.scss';

interface FreezableProps {
  children: (props: { frozen: boolean; FrozenIcon: () => JSX.Element | null }) => ReactElement;
}

export default function Freezable({ children }: FreezableProps) {
  const { frozen } = useFrozen();

  const FrozenIcon = () => (frozen ? <IoSnowSharp /> : null);

  if (frozen) {
    return <div className={style.frozen}>{children({ frozen, FrozenIcon })}</div>;
  }

  return children({ frozen, FrozenIcon });
}
