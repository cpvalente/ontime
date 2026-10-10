import type {
  EntryId,
  TeleprompterAnchor,
  TeleprompterScriptEvent,
  TeleprompterStop,
  TeleprompterSync,
} from 'ontime-types';
import { anchorAtRow, makeTeleprompterLayout, type TeleprompterLayout } from 'ontime-utils';
import { type CSSProperties, memo, type PropsWithChildren, useMemo, useState } from 'react';

import { cx } from '../../common/utils/styleUtils';
import type { TeleprompterViewCommand } from './teleprompter.keymap';
import type { TeleprompterOptions } from './teleprompter.options';
import { useFitText } from './useFitText';
import { useTeleprompterInput } from './useTeleprompterInput';
import { useTeleprompterScroll } from './useTeleprompterScroll';

interface TeleprompterScreenProps {
  events: TeleprompterScriptEvent[];
  charsPerLine: number;
  /** where the screen reads from, in rows of the whole script */
  sync: TeleprompterSync;
  /** the rows of the whole script, which the sync counts */
  scriptLayout: TeleprompterLayout;
  /** the sync refers to a script the screen has not received yet, so the screen holds its place */
  isBehind: boolean;
  /** where playback stopped of its own accord, shown on the reading line */
  ended: TeleprompterStop | null;
  options: TeleprompterOptions;
  loadedEventId: EntryId | null;
  /** where to rest while the position is outside the rows shown */
  fallbackRow?: number;
  /** where the keyboard and the mouse wheel send commands, or nothing for a screen which only displays */
  onCommand?: (command: TeleprompterViewCommand) => void;
  /** a local view scrolls by hand, which moves its position to a place in the rows shown */
  onUserScroll?: (anchor: TeleprompterAnchor) => void;
  inputDisabled?: boolean;
}

/** Renders the rows of the script, and scrolls them to the reading position */
export default function TeleprompterScreen({
  events,
  charsPerLine,
  sync,
  scriptLayout,
  isBehind,
  ended,
  options,
  loadedEventId,
  fallbackRow,
  onCommand,
  onUserScroll,
  inputDisabled = false,
  children,
}: PropsWithChildren<TeleprompterScreenProps>) {
  const [screen, setScreen] = useState<HTMLDivElement | null>(null);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [content, setContent] = useState<HTMLDivElement | null>(null);

  const layout = useMemo(() => makeTeleprompterLayout(events), [events]);
  const lines = useMemo(() => events.flatMap((event) => event.lines), [events]);

  const fontSize = useFitText(content, lines, charsPerLine, options.textWidth);
  const rowHeight = fontSize * options.lineHeight;

  const handleUserScroll = onUserScroll
    ? (row: number) => {
        const anchor = anchorAtRow(layout, row);
        if (anchor) onUserScroll(anchor);
      }
    : undefined;
  useTeleprompterScroll({
    scroller,
    sync,
    scriptLayout,
    isBehind,
    layout,
    rowHeight,
    fallbackRow,
    onUserScroll: handleUserScroll,
  });
  // a screen scrolled by hand takes the wheel as the browser's own scrolling
  useTeleprompterInput({
    screen,
    onCommand,
    rowHeight,
    wheel: !onUserScroll,
    disabled: inputDisabled,
  });

  const hasLoaded = loadedEventId !== null && events.some((event) => event.id === loadedEventId);
  const screenStyles = {
    '--tp-font-size': `${fontSize}px`,
    '--tp-row-height': `${rowHeight}px`,
    '--tp-text-width': `${options.textWidth}%`,
    '--tp-reading-line': options.readingLinePos,
  } as CSSProperties;

  return (
    <div
      className={cx(['teleprompter__screen', hasLoaded && 'teleprompter__screen--has-loaded'])}
      style={screenStyles}
      ref={setScreen}
    >
      <div
        className={cx(['teleprompter__scroller', onUserScroll && 'teleprompter__scroller--by-hand'])}
        data-testid='teleprompter-scroller'
        ref={setScroller}
      >
        <div className='teleprompter__content' ref={setContent}>
          {/* rows wait for the text size, so the script is laid out once */}
          {fontSize > 0 && <ScriptRows events={events} loadedEventId={loadedEventId} />}
        </div>
      </div>

      <div className='teleprompter__dim' />
      {(!options.hideReadingLine || ended) && (
        <div
          className={cx(['teleprompter__reading-line', ended && 'teleprompter__reading-line--stopped'])}
          data-testid='teleprompter-reading-line'
        >
          {!options.hideReadingLine && <span className='teleprompter__reading-marker' />}
          {ended && (
            // where the talent is looking, so the end is clear without the controls
            <span className='teleprompter__end' data-testid='teleprompter-end'>
              {ended === 'event' ? 'End of event' : 'End of script'}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/** The rows change with the script, not the transport, which re-renders the screen on every command and every second of playback */
const ScriptRows = memo(function ScriptRows({
  events,
  loadedEventId,
}: {
  events: TeleprompterScriptEvent[];
  loadedEventId: EntryId | null;
}) {
  return events.map((event) => (
    // the browser skips the layout of events out of view
    <div key={event.id} className='teleprompter__event' style={{ '--tp-rows': event.lines.length } as CSSProperties}>
      {event.lines.map((line, index) => (
        <div
          key={index}
          className={`teleprompter__row teleprompter__row--${line.kind}`}
          data-loaded={event.id === loadedEventId || undefined}
          data-event-id={event.id}
        >
          {line.kind === 'text' ? ' '.repeat(line.indent ?? 0) + line.text : line.kind === 'blank' ? '' : line.text}
        </div>
      ))}
    </div>
  ));
});
