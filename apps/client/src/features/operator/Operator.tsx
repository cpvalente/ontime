import React from 'react';
import { SupportedEvent } from 'ontime-types';

import NavigationMenu from '../.././common/components/navigation-menu/NavigationMenu';
import useRundown from '../../common/hooks-query/useRundown';

import FocusBlock from './focus-block/focus-block';
import OpBlock from './op-block/OpBlock';
import OpEvent from './op-event/OpEvent';
import TimeBlock from './time-block/TimeBlock';

import style from './Operator.module.scss';

export default function Operator() {
  // this is the data that you need, the status flag should give you possibility to create a loading state
  // for debugging data use the react query dev tools (flower thing in the bottom left corner)
  const { data, status } = useRundown();
  const [showChild, setShowChild] = React.useState(false);

  const handleScroll = (event: any) => {
    const scrollThreshold = 50; // Set the scroll threshold here
    const scrollPosition = event.target.scrollTop;

    setShowChild(scrollPosition > scrollThreshold);
  };

  if (!data || status === 'loading') {
    return <>loading</>;
  }

  return (
    <div className={style.operatorContainer}>
      <NavigationMenu />

      <div className={style.operatorEvents} onScroll={handleScroll}>
        {data.map((entry, i) => {
          // there are three types of events, you a filter them by using the type property
          // for this view, we do not show the delay event

          // this is a scheduled event
          if (entry.type === SupportedEvent.Event) {
            return (
              <div
                key={entry.id}
                className={`${style.scheduledEvent} ${i % 3 == 0 ? style.activeEvent : ''}  ${
                  i == 4 ? style.runningTimer : ''
                }`}
              >
                <OpEvent id={i} data={entry} />
              </div>
            );
          }

          // this is a block entry (like a section title)
          if (entry.type === SupportedEvent.Block) {
            return (
              <div key={entry.id} className={style.block}>
                <OpBlock data={entry} />
              </div>
            );
          }
          return null;
        })}
        {showChild && <FocusBlock />}
      </div>
      <TimeBlock />
    </div>
  );
}