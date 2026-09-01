import { IoCheckmarkCircle } from 'react-icons/io5';

import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import { isOntimeCloud, websiteUrl } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './CloudPanel.module.scss';

export default function CloudPanel() {
  if (isOntimeCloud) {
    return null;
  }

  return (
    <Panel.Section>
      <Panel.Card className={style.card}>
        <span className={style.eyebrow}>Ontime Cloud</span>
        <h3 className={style.title}>Run Ontime online with zero setup</h3>
        <p className={style.description}>
          <span>
            Ontime Cloud lets you run and share Ontime online with your team. Subscriptions support continued
            development while Ontime remains fully open-source and self-hostable.
          </span>
          <span className={style.portability}>
            Project files work locally and in Cloud, so your shows can move freely.
          </span>
        </p>
        <ul className={style.benefits}>
          <li>
            <IoCheckmarkCircle />
            Start in minutes, with no setup or maintenance
          </li>
          <li>
            <IoCheckmarkCircle />
            Coordinate multi-track rundowns with Overview views
          </li>
          <li>
            <IoCheckmarkCircle />
            Manage every instance from one dashboard
          </li>
          <li>
            <IoCheckmarkCircle />
            Share secure read-only views with collaborators
          </li>
        </ul>
        <div className={style.actions}>
          <ExternalLink href={websiteUrl}>Learn more about Ontime Cloud</ExternalLink>
        </div>
      </Panel.Card>
    </Panel.Section>
  );
}
