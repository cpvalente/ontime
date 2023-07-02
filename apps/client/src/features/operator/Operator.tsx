import { SupportedEvent } from 'ontime-types';

import useRundown from '../../common/hooks-query/useRundown';

import style from './Operator.module.scss';

import OpBlock from './op-block/OpBlock';

export default function Operator() {
  // this is the data that you need, the status flag should give you possibility to create a loading state
  // for debugging data use the react query dev tools (flower thing in the bottom left corner)
  const { data, status } = useRundown();

  if (!data || status === 'loading') {
    return <>loading</>;
  }

  return (
    <div className={style.operator}>
      {data.map((entry) => {
        // there are three types of events, you a filter them by using the type property
        // for this view, we do not show the delay event

        // this is a scheduled event
        if (entry.type === SupportedEvent.Event) {
          return (
            <div key={entry.id} className={style.scheduledEvent}>
              <OpBlock entry={JSON.stringify(entry, null, 2)} />
            </div>
          );
        }

        // this is a block entry (like a section title)
        if (entry.type === SupportedEvent.Block) {
          return (
            <div key={entry.id} className={style.block}>
              {/* {JSON.stringify(entry, null, 2)} */}
              <OpBlock entry={JSON.stringify(entry, null, 2)} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
