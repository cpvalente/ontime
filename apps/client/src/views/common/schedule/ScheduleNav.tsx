import { cx } from '../../../common/utils/styleUtils';

import { useSchedule } from './ScheduleContext';

import './Schedule.scss';

interface ScheduleNavProps {
  className?: string;
}

export default function ScheduleNav({ className }: ScheduleNavProps) {
  const { numPages, visiblePage } = useSchedule();

  // cap the amount of elements to 11
  if (numPages > 10) {
    return (
      <div className={cx(['schedule-nav', className])}>
        <div className={cx(['schedule-nav__item', visiblePage === 1 && 'schedule-nav__item--selected'])} />
        <div className={cx(['schedule-nav__item', visiblePage === 2 && 'schedule-nav__item--selected'])} />
        <div className={cx(['schedule-nav__item', visiblePage === 3 && 'schedule-nav__item--selected'])} />
        <div className={cx(['schedule-nav__item', visiblePage === 4 && 'schedule-nav__item--selected'])} />
        <div className={cx(['schedule-nav__item', visiblePage === 5 && 'schedule-nav__item--selected'])} />
        <div
          className={cx([
            'schedule-nav__item',
            'schedule-nav__item--indeterminate',
            visiblePage > 5 && visiblePage < numPages - 4 && 'schedule-nav__item--selected',
          ])}
        />
        <div className={cx(['schedule-nav__item', visiblePage === numPages - 4 && 'schedule-nav__item--selected'])} />
        <div className={cx(['schedule-nav__item', visiblePage === numPages - 3 && 'schedule-nav__item--selected'])} />
        <div className={cx(['schedule-nav__item', visiblePage === numPages - 2 && 'schedule-nav__item--selected'])} />
        <div className={cx(['schedule-nav__item', visiblePage === numPages - 1 && 'schedule-nav__item--selected'])} />
        <div className={cx(['schedule-nav__item', visiblePage === numPages && 'schedule-nav__item--selected'])} />
      </div>
    );
  }

  return (
    <div className={cx(['schedule-nav', className])}>
      {numPages > 1 &&
        [...Array(numPages).keys()].map((i) => (
          <div
            key={i}
            className={cx(['schedule-nav__item', i + 1 === visiblePage && 'schedule-nav__item--selected'])}
          />
        ))}
    </div>
  );
}
