import type { EntryId, TeleprompterLine, TeleprompterScriptEvent, TeleprompterState } from 'ontime-types';
import { makeTeleprompterLayout, type TeleprompterMode } from 'ontime-utils';
import { type CSSProperties, type PropsWithChildren, useMemo, useState } from 'react';

import { cx } from '../../common/utils/styleUtils';
import type { TeleprompterPayload } from './teleprompter.keymap';
import type { TeleprompterOptions } from './teleprompter.options';
import { useFitText } from './useFitText';
import { useTeleprompterInput } from './useTeleprompterInput';
import { useTeleprompterScroll } from './useTeleprompterScroll';

interface TeleprompterScreenProps {
  events: TeleprompterScriptEvent[];
  charsPerLine: number;
  transport: TeleprompterState;
  mode: TeleprompterMode;
  options: TeleprompterOptions;
  loadedEventId: EntryId | null;
  /** where to rest while the transport points outside the rows shown */
  fallbackRow?: number;
  /** where the keyboard and the mouse wheel send commands, or nothing for a screen which only displays */
  onCommand?: (payload: TeleprompterPayload) => void;
  inputDisabled?: boolean;
}

type Row = { key: string; eventId: EntryId; line: TeleprompterLine };

/** Renders the rows of the script, and scrolls them to the reading position */
export default function TeleprompterScreen({
  events,
  charsPerLine,
  transport,
  mode,
  options,
  loadedEventId,
  fallbackRow,
  onCommand,
  inputDisabled = false,
  children,
}: PropsWithChildren<TeleprompterScreenProps>) {
  const [screen, setScreen] = useState<HTMLDivElement | null>(null);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [content, setContent] = useState<HTMLDivElement | null>(null);

  const layout = useMemo(() => makeTeleprompterLayout(events), [events]);
  const rows: Row[] = useMemo(
    () =>
      events.flatMap((event) =>
        event.lines.map((line, index) => ({ key: `${event.id}:${index}`, eventId: event.id, line })),
      ),
    [events],
  );
  const lines = useMemo(() => rows.map((row) => row.line), [rows]);

  const fontSize = useFitText(content, lines, charsPerLine, options.textWidth);
  const rowHeight = fontSize * options.lineHeight;

  useTeleprompterScroll({ scroller, transport, layout, mode, rowHeight, fallbackRow });
  useTeleprompterInput({ screen, onCommand, rowHeight, disabled: inputDisabled });

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
      <div className='teleprompter__scroller' data-testid='teleprompter-scroller' ref={setScroller}>
        <div
          className={cx(['teleprompter__content', fontSize === 0 && 'teleprompter__content--measuring'])}
          ref={setContent}
        >
          {rows.map(({ key, eventId, line }) => (
            <div
              key={key}
              className={`teleprompter__row teleprompter__row--${line.kind}`}
              data-loaded={eventId === loadedEventId || undefined}
              data-event-id={eventId}
            >
              {line.kind === 'text' ? ' '.repeat(line.indent ?? 0) + line.text : line.kind === 'blank' ? '' : line.text}
            </div>
          ))}
        </div>
      </div>

      <div className='teleprompter__dim' />
      {options.readingLine && (
        <div className='teleprompter__reading-line' data-testid='teleprompter-reading-line'>
          <span className='teleprompter__reading-marker' />
        </div>
      )}
      {children}
    </div>
  );
}
