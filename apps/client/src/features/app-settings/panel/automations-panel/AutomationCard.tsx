import { PropsWithChildren, ReactNode } from 'react';

import { cx } from '../../../../common/utils/styleUtils';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './AutomationCard.module.scss';

interface AutomationCardProps {
  append: ReactNode;
  className?: string;
}

export default function AutomationCard(props: PropsWithChildren<AutomationCardProps>) {
  const { append, className, children } = props;

  return (
    <Panel.Card className={cx([style.card, className])}>
      {children}
      <div className={style.append}>{append}</div>
    </Panel.Card>
  );
}
