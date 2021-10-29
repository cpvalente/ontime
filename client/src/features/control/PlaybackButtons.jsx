import { memo } from 'react';
import style from './PlaybackControl.module.css';
import StartIconBtn from 'common/components/buttons/StartIconBtn';
import PauseIconBtn from 'common/components/buttons/PauseIconBtn';
import PrevIconBtn from 'common/components/buttons/PrevIconBtn';
import NextIconBtn from 'common/components/buttons/NextIconBtn';
import RollIconBtn from 'common/components/buttons/RollIconBtn';
import UnloadIconBtn from 'common/components/buttons/UnloadIconBtn';
import ReloadIconButton from 'common/components/buttons/ReloadIconBtn';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.playback === nextProps.playback &&
    prevProps.selectedId === nextProps.selectedId
  );
};

const Playback = ({ playback, selectedId, playbackControl }) => {
  return (
    <div className={style.playbackContainer}>
      <StartIconBtn
        active={playback === 'start'}
        clickhandler={() => playbackControl('start')}
        disabled={!selectedId}
      />
      <PauseIconBtn
        active={playback === 'pause'}
        clickhandler={() => playbackControl('pause')}
        disabled={!selectedId}
      />
      <RollIconBtn
        active={playback === 'roll'}
        disabled={playback === 'roll'}
        clickhandler={() => playbackControl('roll')}
      />
    </div>
  );
};

const Transport = ({ playback, selectedId, playbackControl }) => {
  return (
    <div className={style.playbackContainer}>
      <PrevIconBtn
        clickhandler={() => playbackControl('previous')}
        disabled={playback === 'roll'}
      />
      <NextIconBtn
        clickhandler={() => playbackControl('next')}
        disabled={playback === 'roll'}
      />
      <ReloadIconButton
        clickhandler={() => playbackControl('reload')}
        disabled={!selectedId}
      />
      <UnloadIconBtn clickhandler={() => playbackControl('unload')} />
    </div>
  );
};

const PlaybackButtons = (props) => {
  const { playback, selectedId } = props;
  return (
    <>
      <Playback
        playback={playback}
        selectedId={selectedId}
        playbackControl={props.playbackControl}
      />
      <Transport
        playback={playback}
        selectedId={selectedId}
        playbackControl={props.playbackControl}
      />
    </>
  );
};

export default memo(PlaybackButtons, areEqual);
