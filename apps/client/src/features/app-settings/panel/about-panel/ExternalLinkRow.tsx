import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './ExternalLinkRow.module.scss';

interface ExternalLinkRowProps {
  href: string;
  title: string;
  description: string;
}

export default function ExternalLinkRow({ href, title, description }: ExternalLinkRowProps) {
  return (
    <Panel.ListItem interactive>
      <ExternalLink href={href} className={style.link}>
        <Panel.Field title={title} description={description} />
        <span className={style.action}>Open</span>
      </ExternalLink>
    </Panel.ListItem>
  );
}
