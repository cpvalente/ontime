import { TimerPhase } from 'ontime-types';
import { millisToString, removeLeadingZero } from 'ontime-utils';

import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { useRuntimeStore } from '../../common/stores/runtime';

import './QlabTimer.scss';

function getPhaseClass(phase: TimerPhase): string {
  switch (phase) {
    case TimerPhase.Warning:
      return 'countdown--warning';
    case TimerPhase.Danger:
      return 'countdown--danger';
    case TimerPhase.Overtime:
      return 'countdown--overtime';
    default:
      return 'countdown--default';
  }
}

function getProgressPhaseClass(phase: TimerPhase): string {
  switch (phase) {
    case TimerPhase.Warning:
      return 'progress-fill--warning';
    case TimerPhase.Danger:
      return 'progress-fill--danger';
    case TimerPhase.Overtime:
      return 'progress-fill--overtime';
    default:
      return 'progress-fill--default';
  }
}

export default function QlabTimer() {
  const qlab = useRuntimeStore((state) => state.qlab);

  useWindowTitle('QLab Timer');

  if (!qlab.enabled) {
    return (
      <div className='qlab-timer'>
        <div className='idle'>QLab integration disabled</div>
      </div>
    );
  }

  if (!qlab.connected) {
    return (
      <div className='qlab-timer'>
        <div className='status status--disconnected'>Disconnected</div>
        <div className='idle'>Waiting for QLab connection...</div>
      </div>
    );
  }

  if (!qlab.cueName && !qlab.cueNumber) {
    return (
      <div className='qlab-timer'>
        <div className='status status--connected'>Connected</div>
        <div className='idle'>No running cues</div>
      </div>
    );
  }

  const display = removeLeadingZero(millisToString(qlab.remaining));
  const progress = qlab.duration > 0 ? ((qlab.duration - qlab.remaining) / qlab.duration) * 100 : 0;
  const phaseClass = getPhaseClass(qlab.phase);
  const progressPhaseClass = getProgressPhaseClass(qlab.phase);

  return (
    <div className='qlab-timer'>
      <div className='status status--connected'>QLab Connected</div>

      <div className='cue-info'>
        {qlab.cueNumber && <div className='cue-number'>Cue {qlab.cueNumber}</div>}
        {qlab.cueName && <div className='cue-name'>{qlab.cueName}</div>}
      </div>

      <div className={`countdown ${phaseClass} ${qlab.isPaused ? 'countdown--paused' : ''}`}>
        {display}
      </div>

      <div className='progress-bar'>
        <div
          className={`progress-fill ${progressPhaseClass}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {qlab.isPaused && <div className='pause-indicator'>Paused</div>}
    </div>
  );
}
