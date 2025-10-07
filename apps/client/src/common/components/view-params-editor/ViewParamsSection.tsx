import { IoChevronDown } from 'react-icons/io5';
import { useLocalStorage } from '@mantine/hooks';

import { cx } from '../../utils/styleUtils';

import { OptionTitle } from './constants';
import ParamInput from './ParamInput';
import { type ParamField } from './viewParams.types';

import style from './ViewParamsSection.module.scss';

interface ViewParamsSectionProps {
  title: string;
  collapsible?: boolean;
  options: ParamField[];
}

export default function ViewParamsSection({ title, collapsible, options }: ViewParamsSectionProps) {
  const [collapsed, setCollapsed] = useLocalStorage({ key: `params-${title}`, defaultValue: false });

  const handleCollapse = () => {
    if (collapsible) {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <section className={style.section}>
      {title === OptionTitle.Hidden ? (
        <HiddenContents options={options} />
      ) : (
        <>
          <div className={cx([style.sectionHeader, collapsible && style.collapsible])} onClick={handleCollapse}>
            {title}
            {collapsible && <IoChevronDown className={cx([collapsed ? style.closed : style.open])} />}
          </div>
          <SectionContents options={options} collapsed={collapsed} />
        </>
      )}
    </section>
  );
}

interface SectionContentsProps {
  options: ParamField[];
  collapsed: boolean;
}

function SectionContents({ options, collapsed }: SectionContentsProps) {
  return (
    <>
      {options.map((option) => {
        return (
          <label key={option.title} className={cx([style.label, collapsed && style.hidden])}>
            <span className={style.title}>{option.title}</span>
            <span className={style.description}>{option.description}</span>
            <ParamInput paramField={option} />
          </label>
        );
      })}
    </>
  );
}

function HiddenContents({ options }: { options: ParamField[] }) {
  return (
    <>
      {options.map((option, index) => {
        return <ParamInput key={option.title + index} paramField={option} />;
      })}
    </>
  );
}
