import { OntimeView } from 'ontime-types';
import { type CSSProperties, useState } from 'react';

import EmptyPage from '../../common/components/state/EmptyPage';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useSelectedEventId } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { cx } from '../../common/utils/styleUtils';
import Loader from '../common/loader/Loader';
import ControlOverlay from './control-overlay/ControlOverlay';
import HelpOverlay from './help-overlay/HelpOverlay';
import ScriptBlockView from './script-block/ScriptBlock';
import { defaults, getTeleprompterOptions, useTeleprompterOptions } from './teleprompter.options';
import { stepFontSize } from './teleprompter.scroll';
import { buildScript, composeFlip } from './teleprompter.utils';
import { useSyncTeleprompterParams } from './useSyncTeleprompterParams';
import { useTeleprompterControls } from './useTeleprompterControls';
import { type TeleprompterData, useTeleprompterData } from './useTeleprompterData';
import { useTeleprompterScroll } from './useTeleprompterScroll';

import './Teleprompter.scss';

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

  const { scrollerRef, contentRef, registerBlock, controller, isRunning, speed, canReengageFollow, parkedAt } =
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

  useSyncTeleprompterParams({ speed, fontSize: live.fontSize, flipH: live.flipH, flipV: live.flipV });

  useTeleprompterControls({
    controller,
    isHelpOpen: showHelp,
    onFlip: handleFlip,
    onFontSize: handleFontSize,
    onResetFontSize: handleResetFontSize,
    onToggleHelp: handleToggleHelp,
  });

  const hasScriptSource = options.scriptSource !== 'none';

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
        effectiveFlip.flipH && 'teleprompter--flip-h',
        effectiveFlip.flipV && 'teleprompter--flip-v',
        // nothing to hold back the eye from when no event is cued
        blocks.some((block) => block.isLoaded) && 'teleprompter--has-playing',
      ])}
      style={viewStyles}
      data-testid='teleprompter-view'
    >
      <ViewParamsEditor target={OntimeView.Teleprompter} viewOptions={viewOptions} />

      {!hasScriptSource ? (
        <EmptyPage text='Select which field holds the script in the view options' />
      ) : blocks.length === 0 ? (
        <EmptyPage text='There is no script text in the selected field' />
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
          />
        </>
      )}

      <HelpOverlay isOpen={showHelp} onClose={handleToggleHelp} />
    </div>
  );
}
