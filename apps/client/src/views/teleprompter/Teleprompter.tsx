import {
  type EntryId,
  OntimeView,
  type TeleprompterAnchor,
  type TeleprompterScript,
  type TeleprompterState,
} from 'ontime-types';
import { anchorAtRow, makeTeleprompterLayout } from 'ontime-utils';
import { useEffect, useRef, useState } from 'react';

import EmptyPage from '../../common/components/state/EmptyPage';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useViewParamsEditorStore } from '../../common/components/view-params-editor/viewParamsEditor.store';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import useTeleprompterScript from '../../common/hooks-query/useTeleprompterScript';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { useSelectedEventId, useTeleprompterState } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { sendSocket } from '../../common/utils/socket';
import { cx } from '../../common/utils/styleUtils';
import Loader from '../common/loader/Loader';
import ControlOverlay, { type LoadedEvent } from './control-overlay/ControlOverlay';
import HelpOverlay from './help-overlay/HelpOverlay';
import TransportShortcuts from './help-overlay/TransportShortcuts';
import type { TeleprompterPayload } from './teleprompter.keymap';
import {
  getTeleprompterOptions,
  type TeleprompterOptions,
  type TeleprompterRole,
  useTeleprompterOptions,
} from './teleprompter.options';
import { composeFlip, filterToLoadedEvent } from './teleprompter.utils';
import TeleprompterScreen from './TeleprompterScreen';
import { useLocalTransport } from './useLocalTransport';
import { isTypingTarget } from './useTeleprompterInput';

import './Teleprompter.scss';

const helpNotes: Record<TeleprompterRole, string> = {
  remote:
    'This remote screen shows the same line as every other remote screen. Drive it from a controller view, Companion or the integration API',
  controller: 'This controller drives every remote screen. What you see here is what the remote screens show',
  local: 'This view runs on its own. Its keys and buttons only move this view',
};

export default function Teleprompter() {
  const options = useTeleprompterOptions();
  const isMirrored = useViewOptionsStore((state) => state.mirror);
  const { data: viewSettings } = useViewSettings();
  const { data: customFields } = useCustomFields();
  const [showHelp, setShowHelp] = useState(false);

  useWindowTitle('Teleprompter');
  useViewKeys(() => setShowHelp((current) => !current));

  const { role } = options;
  const flip = composeFlip(options.flipH, options.flipV, isMirrored);
  const toggleHelp = () => setShowHelp((current) => !current);

  return (
    <div
      className={cx(['teleprompter', flip.flipH && 'teleprompter--flip-h', flip.flipV && 'teleprompter--flip-v'])}
      data-testid='teleprompter-view'
    >
      <ViewParamsEditor
        target={OntimeView.Teleprompter}
        viewOptions={getTeleprompterOptions(customFields, viewSettings.teleprompter, role)}
      />
      {role === 'local' ? (
        <LocalTeleprompter
          options={options}
          sharedFollowLoaded={viewSettings.teleprompter.followLoaded}
          isHelpOpen={showHelp}
          onToggleHelp={toggleHelp}
        />
      ) : (
        <SharedTeleprompter
          options={options}
          cued={viewSettings.teleprompter.followLoaded}
          isHelpOpen={showHelp}
          onToggleHelp={toggleHelp}
        />
      )}
      <HelpOverlay isOpen={showHelp} onClose={() => setShowHelp(false)} note={helpNotes[role]}>
        {role !== 'remote' && <TransportShortcuts />}
      </HelpOverlay>
    </div>
  );
}

interface TeleprompterViewProps {
  options: TeleprompterOptions;
  isHelpOpen: boolean;
  onToggleHelp: () => void;
}

const sendCommand = (payload: TeleprompterPayload) => sendSocket('teleprompter', payload);

/**
 * Shows the transport the server holds, like every other remote screen
 * A controller also sends commands, which reach every remote screen
 */
function SharedTeleprompter({ options, cued, isHelpOpen, onToggleHelp }: TeleprompterViewProps & { cued: boolean }) {
  const { data: script, status } = useTeleprompterScript();
  const transport = useTeleprompterState();

  return (
    <ScriptContent
      script={script}
      status={status}
      transport={transport}
      cued={cued}
      options={options}
      onCommand={options.role === 'controller' ? sendCommand : undefined}
      isHelpOpen={isHelpOpen}
      onToggleHelp={onToggleHelp}
    />
  );
}

/** Runs the same transport in the browser, over a script fetched with the view's own options */
function LocalTeleprompter({
  options,
  sharedFollowLoaded,
  isHelpOpen,
  onToggleHelp,
}: TeleprompterViewProps & { sharedFollowLoaded: boolean }) {
  const { data: script, status } = useTeleprompterScript(options.scriptSearch);
  const loadedEventId = useSelectedEventId();
  const cued = options.followLoaded ?? sharedFollowLoaded;
  const { state, handleCommand, moveToAnchor } = useLocalTransport({
    events: script?.events ?? noEvents,
    cued,
    initialSpeed: options.speed,
    loadedEventId,
  });

  return (
    <ScriptContent
      script={script}
      status={status}
      transport={state}
      cued={cued}
      options={options}
      onCommand={handleCommand}
      onUserScroll={moveToAnchor}
      isHelpOpen={isHelpOpen}
      onToggleHelp={onToggleHelp}
    />
  );
}

const noEvents: TeleprompterScript['events'] = [];

const waitingMessages = {
  'nothing-loaded': 'Waiting for an event to load. The script of the loaded event shows here',
  'no-script': 'The loaded event has no script',
};

interface ScriptContentProps {
  script: TeleprompterScript | undefined;
  status: 'pending' | 'error' | 'success';
  transport: TeleprompterState;
  cued: boolean;
  options: TeleprompterOptions;
  onCommand?: (payload: TeleprompterPayload) => void;
  onUserScroll?: (anchor: TeleprompterAnchor) => void;
  isHelpOpen: boolean;
  onToggleHelp: () => void;
}

function ScriptContent({
  script,
  status,
  transport,
  cued,
  options,
  onCommand,
  onUserScroll,
  isHelpOpen,
  onToggleHelp,
}: ScriptContentProps) {
  const loadedEventId: EntryId | null = useSelectedEventId();

  if (!script) {
    if (status === 'error') {
      return <EmptyPage variant='error' text='There was an error fetching data, please refresh the page.' />;
    }
    return <Loader />;
  }

  const loadedEvent = getLoadedEvent(script, loadedEventId);
  const controls = (
    <ControlOverlay
      role={options.role}
      transport={transport}
      cued={cued}
      loadedEvent={loadedEvent}
      onCommand={onCommand}
      onToggleHelp={onToggleHelp}
    />
  );

  const shown = options.onlyLoaded ? filterToLoadedEvent(script.events, loadedEventId) : { events: script.events };
  if ('waiting' in shown) {
    return (
      <>
        <EmptyPage text={waitingMessages[shown.waiting]} />
        {controls}
      </>
    );
  }
  if (shown.events.length === 0) return <EmptyPage text='There is no script in the field the teleprompter reads' />;

  // the screen reports a row of the rows it shows, which can be fewer than the whole script
  const handleUserScroll = onUserScroll
    ? (row: number) => {
        const anchor = anchorAtRow(makeTeleprompterLayout(shown.events), row);
        if (anchor) onUserScroll(anchor);
      }
    : undefined;

  return (
    <TeleprompterScreen
      events={shown.events}
      charsPerLine={script.charsPerLine}
      transport={transport}
      mode={{ cued }}
      options={options}
      loadedEventId={loadedEventId}
      fallbackRow={options.onlyLoaded ? shown.events[0]?.lines.findIndex((line) => line.kind === 'text') : undefined}
      onCommand={onCommand}
      onUserScroll={handleUserScroll}
      inputDisabled={isHelpOpen}
    >
      {controls}
    </TeleprompterScreen>
  );
}

function getLoadedEvent(script: TeleprompterScript, loadedEventId: EntryId | null): LoadedEvent | null {
  if (!loadedEventId) return null;
  const event = script.events.find((candidate) => candidate.id === loadedEventId);
  if (!event) return { id: loadedEventId, cue: '', title: '', inScript: false };
  return { id: event.id, cue: event.cue, title: event.title, inScript: true };
}

/**
 * Keys every teleprompter view answers to, whatever its role
 * - ? opens the shortcut list
 * - Space never presses a focused button or opens a menu: on a controller or a local view it only plays and pauses
 */
function useViewKeys(onToggleHelp: () => void) {
  const handler = useRef(onToggleHelp);
  // keeps the latest handler for the listener, which is registered once
  useEffect(() => {
    handler.current = onToggleHelp;
  });

  // runs before any focused element, so Space cannot reach a button or a menu shortcut
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (isTypingTarget(event.target) || useViewParamsEditorStore.getState().isOpen) return;
      if (event.code === 'Space') {
        event.preventDefault();
        return;
      }
      if (event.type === 'keydown' && event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        handler.current();
      }
    }

    window.addEventListener('keydown', handleKey, { capture: true });
    window.addEventListener('keyup', handleKey, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKey, { capture: true });
      window.removeEventListener('keyup', handleKey, { capture: true });
    };
  }, []);
}
