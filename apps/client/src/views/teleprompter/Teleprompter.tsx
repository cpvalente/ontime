import { MessageTag, OntimeView } from 'ontime-types';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

import EmptyPage from '../../common/components/state/EmptyPage';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useSelectedEventId } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { sendSocket, subscribeSocket } from '../../common/utils/socket';
import { cx } from '../../common/utils/styleUtils';
import Loader from '../common/loader/Loader';
import ControlOverlay from './control-overlay/ControlOverlay';
import HelpOverlay from './help-overlay/HelpOverlay';
import ScriptBlockView from './script-block/ScriptBlock';
import { defaults, getTeleprompterOptions, useTeleprompterOptions } from './teleprompter.options';
import { stepFontSize } from './teleprompter.scroll';
import { buildScript, composeFlip } from './teleprompter.utils';
import { useSyncTeleprompterParams } from './useSyncTeleprompterParams';
import { applyTeleprompterCommand, useTeleprompterControls } from './useTeleprompterControls';
import { type TeleprompterData, useTeleprompterData } from './useTeleprompterData';
import { useTeleprompterScroll } from './useTeleprompterScroll';

import './Teleprompter.scss';

const commandHistoryLimit = 100;

function rememberCommandId(receivedIds: Set<string>, commandId: string): boolean {
  if (receivedIds.has(commandId)) return false;

  receivedIds.add(commandId);
  if (receivedIds.size > commandHistoryLimit) {
    for (const oldestCommandId of receivedIds) {
      receivedIds.delete(oldestCommandId);
      break;
    }
  }
  return true;
}

function getEmptyMessage(scriptSource: string, blockCount: number): string | null {
  if (scriptSource === 'none') return 'Select which field holds the script in the view options';
  if (blockCount === 0) return 'There is no script text in the selected field';
  return null;
}

export default function TeleprompterLoader() {
  const { data, status } = useTeleprompterData();

  useWindowTitle('Teleprompter');

  if (status === 'pending') {
    return <Loader />;
  }

  if (status === 'error') {
    return <EmptyPage variant='error' text='There was an error fetching data, please refresh the page.' />;
  }

  return <Teleprompter {...data} />;
}

function Teleprompter({ rundown, rundownMetadata, customFields }: TeleprompterData) {
  'use memo';

  const options = useTeleprompterOptions();
  const selectedEventId = useSelectedEventId();
  const isMirrored = useViewOptionsStore((state) => state.mirror);

  const [showHelp, setShowHelp] = useState(false);
  const [controlMode, setControlMode] = useState(options.controlMode);
  const receivedCommandIds = useRef(new Set<string>());

  useEffect(() => setControlMode(options.controlMode), [options.controlMode]);

  const fromParams = { flipH: options.flipH, flipV: options.flipV, fontSize: options.fontSize };
  const paramsKey = `${fromParams.flipH}|${fromParams.flipV}|${fromParams.fontSize}`;

  const [live, setLive] = useState(fromParams);
  const [seededFrom, setSeededFrom] = useState(paramsKey);
  // Reset live controls before commit when the URL configuration changes.
  if (seededFrom !== paramsKey) {
    setSeededFrom(paramsKey);
    setLive(fromParams);
  }

  const viewOptions = getTeleprompterOptions(customFields);

  const blocks = buildScript(rundown, rundownMetadata, customFields, {
    scriptSource: options.scriptSource,
    heading: options.heading,
    onlyPlaying: options.onlyPlaying,
    hideEmpty: options.hideEmpty,
    showGroups: options.showGroups,
  });

  const { scrollerRef, contentRef, registerBlock, controller, isRunning, speed, isFollowingLoadedEvent, parkedAt } =
    useTeleprompterScroll({
      initialSpeed: options.speed,
      followLoaded: options.followLoaded,
      selectedEventId,
      readingLinePos: options.readingLinePos,
      blocks,
    });

  const handleFlip = (axis: 'h' | 'v') =>
    setLive((current) => {
      const key = axis === 'h' ? 'flipH' : 'flipV';
      return { ...current, [key]: !current[key] };
    });

  const handleFontSize = (steps: number) =>
    setLive((current) => ({ ...current, fontSize: stepFontSize(current.fontSize, steps) }));

  const handleResetFontSize = () => setLive((current) => ({ ...current, fontSize: defaults.fontSize }));
  const handleToggleHelp = () => setShowHelp((current) => !current);
  const handleToggleControlMode = () => setControlMode((current) => (current === 'free' ? 'controlled' : 'free'));
  const isControlled = controlMode === 'controlled';

  useSyncTeleprompterParams({ speed, fontSize: live.fontSize, flipH: live.flipH, flipV: live.flipV });

  useTeleprompterControls({
    controller,
    isHelpOpen: showHelp,
    onFlip: handleFlip,
    onFontSize: handleFontSize,
    onResetFontSize: handleResetFontSize,
    onToggleHelp: handleToggleHelp,
    enabled: !isControlled,
  });

  useEffect(() => {
    return subscribeSocket(MessageTag.TeleprompterCommand, ({ commandId, command }) => {
      if (!isControlled || !rememberCommandId(receivedCommandIds.current, commandId)) return;
      applyTeleprompterCommand(command, controller);
    });
  }, [controller, isControlled]);

  useEffect(() => {
    sendSocket(MessageTag.ClientSet, {
      teleprompter: {
        mode: controlMode,
        playback: isRunning ? 'playing' : 'paused',
        speed,
        isFollowingLoadedEvent,
        parkedAt,
      },
    });
  }, [controlMode, isFollowingLoadedEvent, isRunning, parkedAt, speed]);

  const emptyMessage = getEmptyMessage(options.scriptSource, blocks.length);

  const effectiveFlip = composeFlip(live.flipH, live.flipV, isMirrored);

  const viewStyles = {
    '--tp-configured-font-size': `${live.fontSize}px`,
    '--tp-line-height': options.lineHeight,
    '--tp-text-width': `${options.textWidth}%`,
    '--tp-reading-line': options.readingLinePos,
  } as CSSProperties;

  return (
    <div
      className={cx([
        'teleprompter',
        isControlled && 'teleprompter--controlled',
        effectiveFlip.flipH && 'teleprompter--flip-h',
        effectiveFlip.flipV && 'teleprompter--flip-v',
        // nothing to hold back the eye from when no event is cued
        blocks.some((block) => block.isLoaded) && 'teleprompter--has-playing',
      ])}
      style={viewStyles}
      data-testid='teleprompter-view'
    >
      <ViewParamsEditor target={OntimeView.Teleprompter} viewOptions={viewOptions} />

      {emptyMessage ? (
        <EmptyPage text={emptyMessage} />
      ) : (
        <>
          <div className='teleprompter__scroller' data-testid='teleprompter-scroller' ref={scrollerRef}>
            <div className='teleprompter__content' ref={contentRef}>
              {blocks.map((block) => (
                <ScriptBlockView key={block.id} block={block} registerRef={registerBlock} />
              ))}
            </div>
          </div>

          <div className='teleprompter__dim' />
          {options.readingLine && (
            <div className='teleprompter__reading-line'>
              <span className='teleprompter__reading-marker' />
            </div>
          )}

          <ControlOverlay
            isRunning={isRunning}
            speed={speed}
            parkedAt={parkedAt}
            controller={controller}
            onToggleHelp={handleToggleHelp}
            controlMode={controlMode}
            onToggleControlMode={handleToggleControlMode}
          />
        </>
      )}

      <HelpOverlay isOpen={showHelp} onClose={handleToggleHelp} />
    </div>
  );
}
