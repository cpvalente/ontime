import { ReactNode } from 'react';

import style from './Panel.module.scss';

export function Header({ children }: { children: ReactNode }) {
  return <h2 className={style.header}>{children}</h2>;
}

export function SubHeader({ children }: { children: ReactNode }) {
  return <h3 className={style.subheader}>{children}</h3>;
}

export function Section({ children }: { children: ReactNode }) {
  return <div className={style.section}>{children}</div>;
}

export function Paragraph({ children }: { children: ReactNode }) {
  return <p className={style.paragraph}>{children}</p>;
}

export function Card({ children }: { children: ReactNode }) {
  return <div className={style.card}>{children}</div>;
}

export function Table({ children }: { children: ReactNode }) {
  return <table className={style.table}>{children}</table>;
}
