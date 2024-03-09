import { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../common/utils/styleUtils';

import style from './Panel.module.scss';

export function Header({ children }: { children: ReactNode }) {
  return <h2 className={style.header}>{children}</h2>;
}

export function SubHeader({ children }: { children: ReactNode }) {
  return <h3 className={style.subheader}>{children}</h3>;
}

export function Title({ children }: { children: ReactNode }) {
  return <h4 className={style.title}>{children}</h4>;
}

type AllowedTags = 'div' | 'form';
type SectionProps<C extends AllowedTags> = {
  as?: C;
  children: ReactNode;
} & JSX.IntrinsicElements[C];

export function Section<C extends AllowedTags = 'div'>({ as, children, ...props }: SectionProps<C>) {
  const Element = as ?? 'div';
  return (
    <Element className={style.section} {...(props as HTMLAttributes<HTMLElement>)}>
      {children}
    </Element>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  return <p className={style.paragraph}>{children}</p>;
}

export function Card({ children, ...props }: { children: ReactNode } & JSX.IntrinsicElements['div']) {
  return (
    <div className={style.card} {...props}>
      {children}
    </div>
  );
}

export function Table({ className, children }: { className?: string; children: ReactNode }) {
  const classes = cx([style.table, className]);
  return (
    <div className={style.pad}>
      <table className={classes}>{children}</table>
    </div>
  );
}

export function ListGroup({ children }: { children: ReactNode }) {
  return <ul className={style.listGroup}>{children}</ul>;
}

export function ListItem({ children }: { children: ReactNode }) {
  return <li className={style.listItem}>{children}</li>;
}

export function Field({ title, description, error }: { title: string; description: string; error?: string }) {
  return (
    <div className={style.fieldTitle}>
      {title}
      {error && <Error>{error}</Error>}
      {!error && description && <Description>{description}</Description>}
    </div>
  );
}

export function Description({ children }: { children: ReactNode }) {
  return <div className={style.fieldDescription}>{children}</div>;
}

export function Error({ children }: { children: ReactNode }) {
  return <div className={style.fieldError}>{children}</div>;
}

export function Divider() {
  return <hr className={style.divider} />;
}

export function Loader({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) {
    return null;
  }
  return (
    <div className={style.overlay}>
      <div className={style.loader} />
    </div>
  );
}
