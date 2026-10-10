/** A line of script, cut to fit a number of characters */
export type WrappedLine = {
  /** the characters on the line, without its indentation */
  text: string;
  /** position of the first character in the normalised text */
  start: number;
  /** spaces shown before the text */
  indent: number;
};

/** Punctuation which closes what comes before it, so it never starts a line */
const closingPunctuation = /^[\p{Pe}\p{Pf}.,;:!?…%]+$/u;
const closingOrSpace = /^[\s\p{Pe}\p{Pf}.,;:!?…%]+$/u;
/** Punctuation which opens what comes after it, so it never ends a line */
const openingPunctuation = /^[\p{Ps}\p{Pi}¿¡]+$/u;
/** A word made of a number, which stays with the word after it */
const numberWord = /^\p{N}+([.,:]\p{N}+)*$/u;
/** A line may break after these, when they sit inside a word */
const breakAfter = new Set(['-', '–', '—', '/']);
/** How far closing punctuation may run past the end of a line to stay with its word */
const maxPunctuationOverflow = 2;
/** Spaces a line may break at, which leaves out the no-break spaces */
const breakingSpace = /^[^\S\u00a0\u2007\u202f]+$/u;

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * Normalises the script text the way it is read:
 * tabs become 4 spaces, Windows and old Mac line endings become \n and trailing whitespace is ignored
 * Positions in the script are positions in this text.
 */
export function normaliseScriptText(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').trimEnd();
}

/**
 * Cuts a script text into lines of at most charsPerLine user-perceived characters.
 * Typed line breaks, blank lines, indentation and inner spaces are kept.
 * @returns no lines for a text holding only whitespace
 */
export function wrapText(text: string, charsPerLine: number): WrappedLine[] {
  const normalised = normaliseScriptText(text);
  if (!normalised) return [];

  // a limit which is not a number would never fit a character, so cutting would not end
  const limit = Math.max(1, Math.floor(charsPerLine) || 1);
  const lines: WrappedLine[] = [];
  let lineStart = 0;
  for (const typedLine of normalised.split('\n')) {
    lines.push(...wrapTypedLine(typedLine, lineStart, limit));
    lineStart += typedLine.length + 1;
  }
  return lines;
}

type Grapheme = { text: string; index: number };
/** An unbreakable piece of a line: a word, part of a word, or the spaces between words */
type Piece = { graphemes: Grapheme[]; isSpace: boolean };
/** Pieces which must stay on one line, with the spaces where a line may break before them */
type Chunk = { pieces: Piece[]; spaceBefore: Piece | null };

function wrapTypedLine(typedLine: string, lineStart: number, charsPerLine: number): WrappedLine[] {
  const trimmed = typedLine.trimEnd();
  if (!trimmed) {
    return [{ text: '', start: lineStart, indent: 0 }];
  }

  const typedIndent = trimmed.length - trimmed.trimStart().length;
  // keep room for the text, should the indentation take most of the line
  const indent = Math.min(typedIndent, Math.floor(charsPerLine / 2));
  const width = charsPerLine - indent;
  const content = trimmed.slice(typedIndent);

  const lines: Grapheme[][] = [];
  let current: Grapheme[] = [];

  const fits = (chunkGraphemes: Grapheme[], spaceWidth: number) => {
    const overflow = Math.min(countTrailingClosing(chunkGraphemes), maxPunctuationOverflow);
    return current.length + spaceWidth + chunkGraphemes.length <= width + overflow;
  };

  const queue = makeChunks(toPieces(content));
  while (queue.length > 0) {
    const chunk = queue.shift() as Chunk;
    const chunkGraphemes = chunk.pieces.flatMap((piece) => piece.graphemes);
    const spaceWidth = chunk.spaceBefore?.graphemes.length ?? 0;

    if (current.length > 0 && fits(chunkGraphemes, spaceWidth)) {
      current.push(...(chunk.spaceBefore?.graphemes ?? []), ...chunkGraphemes);
      continue;
    }

    // the space where the line breaks is used up
    if (current.length > 0) {
      lines.push(current);
      current = [];
    }

    if (fits(chunkGraphemes, 0)) {
      current = chunkGraphemes;
      continue;
    }

    // too long for a whole line: give up keeping its words together before cutting a word
    if (chunk.pieces.length > 1) {
      queue.unshift(...splitChunk(chunk.pieces));
      continue;
    }

    // a word longer than a line breaks at the limit
    let rest = chunkGraphemes;
    while (!fits(rest, 0)) {
      lines.push(rest.slice(0, width));
      rest = rest.slice(width);
    }
    current = rest;
  }
  if (current.length > 0) lines.push(current);

  const contentStart = lineStart + typedIndent;
  return lines.map((graphemes) => {
    const first = graphemes[0];
    const last = graphemes[graphemes.length - 1];
    return {
      text: content.slice(first.index, last.index + last.text.length),
      start: contentStart + first.index,
      indent,
    };
  });
}

/** Splits a text into words and the spaces between them, then words at the dashes and slashes inside them */
function toPieces(content: string): Piece[] {
  const pieces: Piece[] = [];
  for (const { segment, index } of segmenter.segment(content)) {
    const isSpace = breakingSpace.test(segment);
    const previous = pieces.at(-1);
    if (previous && previous.isSpace === isSpace) {
      previous.graphemes.push({ text: segment, index });
    } else {
      pieces.push({ graphemes: [{ text: segment, index }], isSpace });
    }
  }

  return pieces.flatMap((piece) => (piece.isSpace ? [piece] : splitWord(piece.graphemes)));
}

function splitWord(graphemes: Grapheme[]): Piece[] {
  const parts: Piece[] = [];
  let from = 0;
  for (let i = 1; i < graphemes.length - 1; i++) {
    const next = graphemes[i + 1].text;
    if (breakAfter.has(graphemes[i].text) && !breakAfter.has(next) && !closingPunctuation.test(next)) {
      parts.push({ graphemes: graphemes.slice(from, i + 1), isSpace: false });
      from = i + 1;
    }
  }
  parts.push({ graphemes: graphemes.slice(from), isSpace: false });
  return parts;
}

/** Groups pieces between the places a line may break */
function makeChunks(pieces: Piece[]): Chunk[] {
  const chunks: Chunk[] = [];
  let spaceBefore: Piece | null = null;

  for (const piece of pieces) {
    if (piece.isSpace) {
      spaceBefore = piece;
      continue;
    }

    const current = chunks.at(-1);
    if (current && spaceBefore && !canBreakBetween(current.pieces.at(-1) as Piece, piece)) {
      current.pieces.push(spaceBefore, piece);
    } else if (current && !spaceBefore) {
      // a word split at a dash breaks without a space
      chunks.push({ pieces: [piece], spaceBefore: null });
    } else {
      chunks.push({ pieces: [piece], spaceBefore });
    }
    spaceBefore = null;
  }
  return chunks;
}

/** Undoes the grouping of a chunk, leaving every space in it a place to break */
function splitChunk(pieces: Piece[]): Chunk[] {
  const chunks: Chunk[] = [];
  let spaceBefore: Piece | null = null;
  for (const piece of pieces) {
    if (piece.isSpace) {
      spaceBefore = piece;
    } else {
      chunks.push({ pieces: [piece], spaceBefore });
      spaceBefore = null;
    }
  }
  return chunks;
}

function canBreakBetween(before: Piece, after: Piece): boolean {
  const beforeText = toText(before);
  if (openingPunctuation.test(beforeText) || numberWord.test(beforeText)) return false;
  return !closingPunctuation.test(toText(after));
}

/** Closing punctuation at the end of a chunk, with any space before it */
function countTrailingClosing(graphemes: Grapheme[]): number {
  let count = 0;
  for (let i = graphemes.length - 1; i > 0 && closingOrSpace.test(graphemes[i].text); i--) {
    count++;
  }
  return count;
}

function toText(piece: Piece): string {
  return piece.graphemes.map((grapheme) => grapheme.text).join('');
}
