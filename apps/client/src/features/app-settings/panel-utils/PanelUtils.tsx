import { HTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { Button } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';

import { cx } from '../../../common/utils/styleUtils';

import style from './PanelUtils.module.scss';

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

export function Section<C extends AllowedTags = 'div'>({ as, className, children, ...props }: SectionProps<C>) {
  const Element = as ?? 'div';
  return (
    <Element className={cx([style.section, className])} {...(props as HTMLAttributes<HTMLElement>)}>
      {children}
    </Element>
  );
}

export function Indent<C extends AllowedTags = 'div'>({ as, className, children, ...props }: SectionProps<C>) {
  const Element = as ?? 'div';
  return (
    <Element className={cx([style.indent, className])} {...(props as HTMLAttributes<HTMLElement>)}>
      {children}
    </Element>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  return <p className={style.paragraph}>{children}</p>;
}

export function Card({ children, className, ...props }: { children: ReactNode } & JSX.IntrinsicElements['div']) {
  return (
    <div className={cx([style.card, className])} {...props}>
      {children}
    </div>
  );
}

export function Table({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={style.pad}>
      <table className={cx([style.table, className])}>{children}</table>
    </div>
  );
}

export function TableEmpty({ label, handleClick }: { label?: string; handleClick?: () => void }) {
  return (
    <tr className={style.empty}>
      <td colSpan={99}>
        <div>{label ?? 'No data yet'}</div>
        <Button onClick={handleClick} isDisabled={!handleClick} variant='ontime-filled' rightIcon={<IoAdd />} size='sm'>
          New
        </Button>
      </td>
    </tr>
  );
}

export function ListGroup({ className, children }: { className?: string; children: ReactNode }) {
  return <ul className={cx([style.listGroup, className])}>{children}</ul>;
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

export function Highlight({ children }: { children: ReactNode }) {
  return <code className={style.highlight}>{children}</code>;
}

export function BlockQuote({ children }: { children: ReactNode }) {
  return <blockquote className={style.blockquote}>{children}</blockquote>;
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

type AllowedInlineTags = 'div' | 'td';
type InlineProps<C extends AllowedInlineTags> = {
  as?: C;
  relation?: 'inner' | 'component' | 'section';
  align?: 'start' | 'end';
  className?: string;
};

export function InlineElements<C extends AllowedInlineTags = 'div'>({
  children,
  as,
  relation = 'component',
  align = 'start',
  className,
}: PropsWithChildren<InlineProps<C>>) {
  const Element = as ?? 'div';
  return <Element className={cx([style.inlineElements, style[relation], style[align], className])}>{children}</Element>;
}
