import { useLocalStorage } from '@mantine/hooks';
import { IoChevronDown } from 'react-icons/io5';
import { useSearchParams } from 'react-router';

import { cx } from '../../utils/styleUtils';
import Eyebrow from '../eyebrow/Eyebrow';
import { OptionTitle } from './constants';
import ParamInput from './ParamInput';
import { type ParamField } from './viewParams.types';

import style from './ViewParamsSection.module.scss';

interface ViewParamsSectionProps {
  title: string;
  collapsible?: boolean;
  options: ParamField[];
}

/** Fields which are compact enough to share a row with their label */
function isInlineField(option: ParamField): boolean {
  return option.type === 'boolean' || option.type === 'colour';
}

export default function ViewParamsSection({ title, collapsible, options }: ViewParamsSectionProps) {
  const [collapsed, setCollapsed] = useLocalStorage({ key: `params-${title}`, defaultValue: false });
  const [searchParams] = useSearchParams();

  // hidden options are inputs without a UI, there is nothing to frame them with
  if (title === OptionTitle.Hidden) {
    return <HiddenContents options={options} />;
  }

  const isCollapsed = Boolean(collapsible && collapsed);

  return (
    <section className={style.section}>
      <SectionHeader
        title={title}
        isCustomised={options.some((option) => searchParams.has(option.id))}
        collapsed={isCollapsed}
        onToggle={collapsible ? () => setCollapsed((prev) => !prev) : undefined}
      />
      {/* collapsed options stay mounted: the form reads its values from the DOM */}
      <div className={cx([style.options, isCollapsed && style.hidden])}>
        {options.map((option) => (
          <label key={option.title} className={cx([style.label, isInlineField(option) && style.inline])}>
            <span className={style.title}>{option.title}</span>
            <span className={style.description}>{option.description}</span>
            <ParamInput paramField={option} />
          </label>
        ))}
      </div>
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  isCustomised: boolean;
  collapsed: boolean;
  /** a header without a toggle belongs to a section which cannot collapse */
  onToggle?: () => void;
}

function SectionHeader({ title, isCustomised, collapsed, onToggle }: SectionHeaderProps) {
  const label = (
    <Eyebrow className={style.sectionTitle}>
      {title}
      {isCustomised && <span className={style.customised} title='Contains custom values' />}
    </Eyebrow>
  );

  if (!onToggle) {
    return <div className={style.sectionHeader}>{label}</div>;
  }

  return (
    <button
      type='button'
      className={cx([style.sectionHeader, style.collapsible])}
      aria-expanded={!collapsed}
      onClick={onToggle}
    >
      {label}
      <IoChevronDown className={cx([style.chevron, collapsed && style.closed])} />
    </button>
  );
}

function HiddenContents({ options }: { options: ParamField[] }) {
  return (
    <>
      {options.map((option) => {
        return <ParamInput key={option.id} paramField={option} />;
      })}
    </>
  );
}
