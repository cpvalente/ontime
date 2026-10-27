import type { TeleprompterLine } from 'ontime-types';

/** Cuts words separated by single spaces into text lines, as the server does for plain text */
export function makeTextLines(text: string, charsPerLine: number): TeleprompterLine[] {
  const lines: TeleprompterLine[] = [];
  let line: { text: string; start: number } | null = null;
  let start = 0;
  for (const word of text.split(' ')) {
    if (word && line && line.text.length + 1 + word.length <= charsPerLine) {
      line.text += ` ${word}`;
    } else if (word) {
      if (line) lines.push({ kind: 'text', ...line });
      line = { text: word, start };
    }
    start += word.length + 1;
  }
  if (line) lines.push({ kind: 'text', ...line });
  return lines;
}
