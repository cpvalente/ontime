import { PropsWithChildren, useState } from 'react';
import { Button } from '@chakra-ui/react';

import style from './Expand.module.scss';

interface ExpandProps {
  initialExpanded?: boolean;
}

export default function Expand(props: PropsWithChildren<ExpandProps>) {
  const { children, initialExpanded } = props;
  const [expanded, setExpanded] = useState(initialExpanded);

  return (
    <div className={style.container}>
      {expanded && children}
      <div className={style.separator}>
        <Button size='xs' variant='ontime-ghosted-white' onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      </div>
    </div>
  );
}
