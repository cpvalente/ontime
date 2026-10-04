import { OntimeView } from 'ontime-types';
import { type CSSProperties, useState } from 'react';

import EmptyPage from '../../common/components/state/EmptyPage';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useSelectedEventId, useTeleprompterState } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { cx } from '../../common/utils/styleUtils';
import Loader from '../common/loader/Loader';
import ControlOverlay from './control-overlay/ControlOverlay';
import HelpOverlay from './help-overlay/HelpOverlay';
import ScriptBlockView from './script-block/ScriptBlock';
import { getTeleprompterOptions, useTeleprompterOptions } from './teleprompter.options';
import { buildScript, composeFlip } from './teleprompter.utils';
import { useTeleprompterControls } from './useTeleprompterControls';
import { type TeleprompterData, useTeleprompterData } from './useTeleprompterData';
import { useTeleprompterRemote } from './useTeleprompterRemote';
import { useTeleprompterScroll } from './useTeleprompterScroll';

import './Teleprompter.scss';

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
  const remoteState = useTeleprompterState();
  const isRemoteControlled = options.remoteControl;

  const [showHelp, setShowHelp] = useState(false);

  const viewOptions = getTeleprompterOptions(customFields);

  const blocks = buildScript(rundown, rundownMetadata, customFields, {
    scriptSource: options.scriptSource,
    heading: options.heading,
    onlyPlaying: options.onlyPlaying,
    hideEmpty: options.hideEmpty,
    showGroups: options.showGroups,
  });

  const { scrollerRef, contentRef, registerBlock, controller, isRunning, speed, canReengageFollow, parkedAt } =
    useTeleprompterScroll({
      initialSpeed: isRemoteControlled ? remoteState.speed : options.speed,
      followLoaded: options.followLoaded,
      selectedEventId,
      readingLinePos: options.readingLinePos,
      blocks,
    });

  const handleToggleHelp = () => setShowHelp((current) => !current);

  useTeleprompterControls({ controller, isHelpOpen: showHelp, onToggleHelp: handleToggleHelp, isRemoteControlled });

  useTeleprompterRemote({ isEnabled: isRemoteControlled, playback: remoteState.playback, controller, selectedEventId });

  const emptyMessage = getEmptyMessage(options.scriptSource, blocks.length);

  const effectiveFlip = composeFlip(options.flipH, options.flipV, isMirrored);

  const viewStyles = {
    '--tp-chars-per-line': options.charsPerLine,
    '--tp-line-height': options.lineHeight,
    '--tp-text-width': `${options.textWidth}cqi`,
    '--tp-reading-line': options.readingLinePos,
  } as CSSProperties;

  return (
    <div
      className={cx([
        'teleprompter',
        isRemoteControlled && 'teleprompter--remote',
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
            canReengageFollow={canReengageFollow}
            parkedAt={parkedAt}
            controller={controller}
            onToggleHelp={handleToggleHelp}
            isRemoteControlled={isRemoteControlled}
          />
        </>
      )}

      <HelpOverlay isOpen={showHelp} onClose={handleToggleHelp} isRemoteControlled={isRemoteControlled} />
    </div>
  );
}
