import { ReactElement } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';
import { IconBaseProps } from '@react-icons/all-files';
import { IoSnowSharp } from '@react-icons/all-files/io5/IoSnowSharp';

import { useFrozen } from '../../../common/hooks/useSocket';
import { cx } from '../../../common/utils/styleUtils';

import style from './Freezable.module.scss';

interface FreezableProps extends Omit<BoxProps, 'children'> {
  children: (props: { frozen: boolean; FrozenIcon: (props: IconBaseProps) => JSX.Element | null }) => ReactElement;
}

export default function Freezable({ children, className, ...props }: FreezableProps) {
  const { frozen } = useFrozen();

  const FrozenIcon = (iconProps: IconBaseProps) => (frozen ? <IoSnowSharp {...iconProps} /> : null);

  if (frozen) {
    return (
      <Box className={cx([style.frozen, className])} {...props}>
        {children({ frozen, FrozenIcon })}
      </Box>
    );
  }

  return (
    <Box className={className} {...props}>
      {children({ frozen, FrozenIcon })}
    </Box>
  );
}
