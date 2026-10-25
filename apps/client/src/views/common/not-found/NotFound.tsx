import { Link } from 'react-router';

import EmptyImage from '../../../assets/images/empty.svg?react';
import { getIsNavigationLocked } from '../../../externals';

import linkStyle from '../../../common/components/link/app-link/AppLink.module.scss';
import style from './NotFound.module.scss';

const alternateViews = [
  { label: 'Timer', to: '/timer' },
  { label: 'Backstage', to: '/backstage' },
  { label: 'Countdown', to: '/countdown' },
];

export default function NotFound() {
  const canNavigate = !getIsNavigationLocked();

  return (
    <div className={style.notFound}>
      <section className={style.content}>
        <EmptyImage className={style.illustration} aria-hidden />
        <h1>Page not found</h1>
        <p>
          {canNavigate
            ? 'You might find what you need in another view.'
            : 'This shared link is unavailable. Ask the link owner for a new link.'}
        </p>
        {canNavigate ? (
          <nav className={style.actions} aria-label='Other views'>
            {alternateViews.map((view) => (
              <Link key={view.to} to={view.to} className={linkStyle.link}>
                {view.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
