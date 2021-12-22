import { memo } from 'react';
import PropTypes from 'prop-types';
import style from './PlaybackControl.module.scss';
import StartIconBtn from 'common/components/buttons/StartIconBtn';
import PauseIconBtn from 'common/components/buttons/PauseIconBtn';
import PrevIconBtn from 'common/components/buttons/PrevIconBtn';
import NextIconBtn from 'common/components/buttons/NextIconBtn';
import RollIconBtn from 'common/components/buttons/RollIconBtn';
import UnloadIconBtn from 'common/components/buttons/UnloadIconBtn';
import ReloadIconButton from 'common/components/buttons/ReloadIconBtn';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.playback === nextProps.playback
    && prevProps.selectedId === nextProps.selectedId
    && prevProps.noEvents === nextProps.noEvents
  );
};

const Playback = (props) => {
  const { playback, selectedId, playbackControl, noEvents } = props;
  const isRolling = playback === 'roll';

  return (
    <div className={style.playbackContainer}>
      <StartIconBtn
        active={playback === 'start'}
        clickhandler={() => playbackControl('start')}
        disabled={!selectedId || isRolling || noEvents}
      />
      <PauseIconBtn
        active={playback === 'pause'}
        clickhandler={() => playbackControl('pause')}
        disabled={!selectedId || isRolling || noEvents || playback !== 'start'}
      />
      <RollIconBtn
        active={playback === 'roll'}
        disabled={playback === 'roll' || noEvents}
        clickhandler={() => playbackControl('roll')}
      />
    </div>
  );
};

const Transport = (props) => {
  const { playback, selectedId, playbackControl, noEvents } = props;
  const isRolling = playback === 'roll';

  return (
    <div className={style.playbackContainer}>
      <PrevIconBtn
        clickhandler={() => playbackControl('previous')}
        disabled={isRolling || noEvents}
      />
      <NextIconBtn
        clickhandler={() => playbackControl('next')}
        disabled={isRolling || noEvents}
      />
      <ReloadIconButton
        clickhandler={() => playbackControl('reload')}
        disabled={selectedId == null || isRolling || noEvents}
      />
      <UnloadIconBtn
        clickhandler={() => playbackControl('unload')}
        disabled={(selectedId == null && !isRolling) || noEvents}
      />
    </div>
  );
};

const PlaybackButtons = (props) => {
  const { playback, selectedId, noEvents } = props;
  return (
    <>
      <Playback
        playback={playback}
        selectedId={selectedId}
        noEvents={noEvents}
        playbackControl={props.playbackControl}
      />
      <Transport
        playback={playback}
        selectedId={selectedId}
        noEvents={noEvents}
        playbackControl={props.playbackControl}
      />
    </>
  );
};

export default memo(PlaybackButtons, areEqual);

PlaybackButtons.propTypes = {
  playback: PropTypes.string,
  selectedId: PropTypes.string,
  playbackControl: PropTypes.func.isRequired,
  noEvents: PropTypes.bool.isRequired,
};

Transport.propTypes = {
  playback: PropTypes.string,
  selectedId: PropTypes.string,
  playbackControl: PropTypes.func.isRequired,
  noEvents: PropTypes.bool.isRequired,
};
