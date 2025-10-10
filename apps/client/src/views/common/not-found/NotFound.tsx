import EmptyImage from '../../../assets/images/empty.svg?react';

import style from './NotFound.module.scss';

export default function NotFound() {
  return (
    <div className={style.notFound}>
      <section className={style.content}>
        <EmptyImage />
        <h1>Not found</h1>
        <div>
          The page you are after was not found.
          <br />
          It may have moved or your URL may be incorrect.
          <br />
          Double check the URL and try again.
        </div>
      </section>
    </div>
  );
}
