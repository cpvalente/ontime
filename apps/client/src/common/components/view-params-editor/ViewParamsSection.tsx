import { IoChevronDown } from 'react-icons/io5';
import { useLocalStorage } from '@mantine/hooks';

import { cx } from '../../utils/styleUtils';

import ParamInput from './ParamInput';
import { type ParamField } from './types';

import style from './ViewParamsSection.module.scss';

interface ViewParamsSectionProps {
  title: string;
  collapsible?: boolean;
  options: ParamField[];
}

export default function ViewParamsSection(props: ViewParamsSectionProps) {
  const { title, collapsible, options } = props;

  const [collapsed, setCollapsed] = useLocalStorage({ key: `params-${title}`, defaultValue: false });

  const handleCollapse = () => {
    if (collapsible) {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <section className={style.section}>
      <div className={cx([style.sectionHeader, collapsible && style.collapsible])} onClick={handleCollapse}>
        {title}
        {collapsible && <IoChevronDown className={cx([collapsed ? style.closed : style.open])} />}
      </div>

      {!collapsed && (
        <>
          {options.map((option) => {
            if (option.type === 'persist') {
              return null;
            }

            return (
              <label key={option.title} className={style.label}>
                <span className={style.title}>{option.title}</span>
                <span className={style.description}>{option.description}</span>
                <ParamInput paramField={option} />
              </label>
            );
          })}
        </>
      )}
    </section>
  );
}
