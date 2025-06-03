import { EntryId } from 'ontime-types';

import Empty from '../../common/components/state/Empty';
import { cx } from '../../common/utils/styleUtils';
import { useTranslation } from '../../translation/TranslationProvider';

import './Countdown.scss';

interface CountdownListProps {
  subscriptions: EntryId[];
}

export default function CountdownList(props: CountdownListProps) {
  const { subscriptions } = props;
  const { getLocalizedString } = useTranslation();

  if (subscriptions.length === 0) {
    return <Empty text={getLocalizedString('countdown.select_event')} className='empty-container' />;
  }

  return (
    <>
      {subscriptions.map((sub) => {
        return (
          <div key={sub} className={cx(['sub', 'sub--interactive'])}>
            <div className='sub__binder' style={{ '--user-color': `red` }} />
            <div className='sub__schedule'>14:45:00 - 15:05:00</div>
            <div className='sub__playback'>Playing</div>
            <div className='sub__title'>Portugal</div>
            <div className='sub__timer'>15:00</div>
          </div>
        );
      })}
    </>
  );
}
