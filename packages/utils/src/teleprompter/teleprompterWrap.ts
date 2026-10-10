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
const hasBreakAfter = /[-–—/]/;
/** How far closing punctuation may run past the end of a line to stay with its word */
const maxPunctuationOverflow = 2;
/** Spaces a line may break at, which leaves out the no-break spaces */
const breakingSpaces = /[^\S\u00a0\u2007\u202f]+/gu;
const breakingSpace = /^[^\S\u00a0\u2007\u202f]+$/u;
/**
 * A breaking space joined to a character next to it in one user-perceived character:
 * followed by an extending or spacing mark, or after a prepended concatenation mark
 */
const spaceInGrapheme =
  /[^\S\u00a0\u2007\u202f][\p{M}\p{Grapheme_Extend}\u200d\u0e33\u0eb3]|[\u0600-\u0605\u06dd\u070f\u0890\u0891\u08e2\u0d4e\u{110bd}\u{110cd}][^\S\u00a0\u2007\u202f]/u;
/**
 * Text where every code unit is a user-perceived character of its own, which covers most scripts without
 * segmenting them: no marks which join a character, no characters outside the basic plane such as emoji,
 * no Hangul jamo, and none of the few letters which join their neighbour
 */
const oneUnitPerCharacter =
  /^[^\p{M}\p{Grapheme_Extend}\u200c\u200d\u0e33\u0eb3\u1100-\u11ff\ua960-\ua97f\ud7b0-\ud7ff\u0600-\u0605\u06dd\u070f\u0890\u0891\u08e2\u0d4e\u{10000}-\u{10ffff}]*$/u;

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * Normalises the script text the way it is read:
 * tabs become 4 spaces, Windows line endings become \n and trailing whitespace is ignored
 * Positions in the script are positions in this text.
 */
export function normaliseScriptText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\t/g, '    ').trimEnd();
}

/**
 * Cuts a script text into lines of at most charsPerLine user-perceived characters.
 * Typed line breaks, blank lines, indentation and inner spaces are kept.
 * @returns no lines for a text holding only whitespace
 */
export function wrapText(text: string, charsPerLine: number): WrappedLine[] {
  const normalised = normaliseScriptText(text);
  if (!normalised) return [];

  const limit = Math.max(1, Math.floor(charsPerLine));
  const lines: WrappedLine[] = [];
  let lineStart = 0;
  for (const typedLine of normalised.split('\n')) {
    wrapTypedLine(typedLine, lineStart, limit, lines);
    lineStart += typedLine.length + 1;
  }
  return lines;
}

/** An unbreakable piece of a line: a word, part of a word, or the spaces between words, by position in the line */
type Piece = { start: number; end: number; width: number; isSpace: boolean };
/** Pieces which must stay on one line, with the spaces where a line may break before them */
type Chunk = { pieces: Piece[]; spaceBefore: Piece | null; width: number };

function wrapTypedLine(typedLine: string, lineStart: number, charsPerLine: number, lines: WrappedLine[]) {
  const trimmed = typedLine.trimEnd();
  if (!trimmed) {
    lines.push({ text: '', start: lineStart, indent: 0 });
    return;
  }

  const typedIndent = trimmed.length - trimmed.trimStart().length;
  // keep room for the text, should the indentation take most of the line
  const indent = Math.min(typedIndent, Math.floor(charsPerLine / 2));
  const width = charsPerLine - indent;
  const content = trimmed.slice(typedIndent);
  const contentStart = lineStart + typedIndent;

  // the line being filled, by position in the content and its width in user-perceived characters
  let current: { start: number; end: number; width: number } | null = null;
  const pushLine = (start: number, end: number) => {
    lines.push({ text: content.slice(start, end), start: contentStart + start, indent });
  };

  const fits = (chunk: Chunk, spaceWidth: number) => {
    const overflow = trailingClosing(content, chunk);
    return (current?.width ?? 0) + spaceWidth + chunk.width <= width + overflow;
  };

  const queue = makeChunks(content, toPieces(content));
  for (let i = 0; i < queue.length; i++) {
    const chunk = queue[i];
    const chunkStart = chunk.pieces[0].start;
    const chunkEnd = chunk.pieces[chunk.pieces.length - 1].end;
    const spaceWidth = chunk.spaceBefore?.width ?? 0;

    if (current && fits(chunk, spaceWidth)) {
      current.end = chunkEnd;
      current.width += spaceWidth + chunk.width;
      continue;
    }

    // the space where the line breaks is used up
    if (current) {
      pushLine(current.start, current.end);
      current = null;
    }

    if (fits(chunk, 0)) {
      current = { start: chunkStart, end: chunkEnd, width: chunk.width };
      continue;
    }

    // too long for a whole line: give up keeping its words together before cutting a word
    if (chunk.pieces.length > 1) {
      queue.splice(i + 1, 0, ...splitChunk(chunk.pieces));
      continue;
    }

    // a word longer than a line breaks at the limit, never inside a character
    const graphemes = graphemesOf(content.slice(chunkStart, chunkEnd));
    let from = 0;
    let offset = chunkStart;
    const restFits = () => {
      const rest = graphemes.length - from;
      return rest <= width + Math.min(trailingClosingOf(graphemes, from), maxPunctuationOverflow);
    };
    while (!restFits()) {
      let end = offset;
      for (let g = from; g < from + width; g++) end += graphemes[g].length;
      pushLine(offset, end);
      from += width;
      offset = end;
    }
    current = from < graphemes.length ? { start: offset, end: chunkEnd, width: graphemes.length - from } : null;
  }
  if (current) pushLine(current.start, current.end);
}

/** Splits a text into words and the spaces between them, then words at the dashes and slashes inside them */
function toPieces(content: string): Piece[] {
  // a space joined to a mark is one character with it, which only splitting by character keeps
  if (spaceInGrapheme.test(content)) return toPiecesByGrapheme(content);

  const pieces: Piece[] = [];
  let wordStart = 0;
  for (const space of content.matchAll(breakingSpaces)) {
    if (space.index > wordStart) addWord(content, wordStart, space.index, pieces);
    const end = space.index + space[0].length;
    pieces.push({ start: space.index, end, width: space[0].length, isSpace: true });
    wordStart = end;
  }
  if (wordStart < content.length) addWord(content, wordStart, content.length, pieces);
  return pieces;
}

function toPiecesByGrapheme(content: string): Piece[] {
  const pieces: Piece[] = [];
  let run: Piece | null = null;
  for (const { segment, index } of segmenter.segment(content)) {
    const isSpace = breakingSpace.test(segment);
    if (run && run.isSpace === isSpace) {
      run.end = index + segment.length;
      run.width++;
    } else {
      if (run) pushRun(content, run, pieces);
      run = { start: index, end: index + segment.length, width: 1, isSpace };
    }
  }
  if (run) pushRun(content, run, pieces);
  return pieces;
}

function pushRun(content: string, run: Piece, pieces: Piece[]) {
  if (run.isSpace) pieces.push(run);
  else addWord(content, run.start, run.end, pieces);
}

/** Adds a word, split after the dashes and slashes inside it */
function addWord(content: string, start: number, end: number, pieces: Piece[]) {
  const word = content.slice(start, end);
  if (!hasBreakAfter.test(word)) {
    pieces.push({ start, end, width: graphemeCount(word), isSpace: false });
    return;
  }

  const graphemes = graphemesOf(word);
  let from = 0;
  let fromOffset = start;
  let offset = start;
  for (let i = 0; i < graphemes.length; i++) {
    offset += graphemes[i].length;
    if (i === 0 || i >= graphemes.length - 1) continue;
    const next = graphemes[i + 1];
    if (breakAfter.has(graphemes[i]) && !breakAfter.has(next) && !closingPunctuation.test(next)) {
      pieces.push({ start: fromOffset, end: offset, width: i + 1 - from, isSpace: false });
      from = i + 1;
      fromOffset = offset;
    }
  }
  pieces.push({ start: fromOffset, end, width: graphemes.length - from, isSpace: false });
}

/** Groups pieces between the places a line may break */
function makeChunks(content: string, pieces: Piece[]): Chunk[] {
  const chunks: Chunk[] = [];
  let spaceBefore: Piece | null = null;

  for (const piece of pieces) {
    if (piece.isSpace) {
      spaceBefore = piece;
      continue;
    }

    const current = chunks.at(-1);
    if (current && spaceBefore && !canBreakBetween(content, current.pieces[current.pieces.length - 1], piece)) {
      current.pieces.push(spaceBefore, piece);
      current.width += spaceBefore.width + piece.width;
    } else if (current && !spaceBefore) {
      // a word split at a dash breaks without a space
      chunks.push({ pieces: [piece], spaceBefore: null, width: piece.width });
    } else {
      chunks.push({ pieces: [piece], spaceBefore, width: piece.width });
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
      chunks.push({ pieces: [piece], spaceBefore, width: piece.width });
      spaceBefore = null;
    }
  }
  return chunks;
}

function canBreakBetween(content: string, before: Piece, after: Piece): boolean {
  const beforeText = content.slice(before.start, before.end);
  if (openingPunctuation.test(beforeText) || numberWord.test(beforeText)) return false;
  return !closingPunctuation.test(content.slice(after.start, after.end));
}

/**
 * Closing punctuation at the end of a chunk, with any space before it, as far as it may overflow a line
 * The chunk's first character never counts
 */
function trailingClosing(content: string, chunk: Chunk): number {
  let count = 0;
  for (let p = chunk.pieces.length - 1; p >= 0; p--) {
    const piece = chunk.pieces[p];
    const text = content.slice(piece.start, piece.end);
    const graphemes = oneUnitPerCharacter.test(text) ? null : graphemesOf(text);
    for (let g = piece.width - 1; g >= 0; g--) {
      const grapheme = graphemes ? graphemes[g] : text[g];
      if (count >= chunk.width - 1 || !closingOrSpace.test(grapheme)) return count;
      count++;
      if (count === maxPunctuationOverflow) return count;
    }
  }
  return count;
}

/** Closing punctuation at the end of what is left of a word, from a character on */
function trailingClosingOf(graphemes: string[], from: number): number {
  let count = 0;
  for (let i = graphemes.length - 1; i > from && closingOrSpace.test(graphemes[i]); i--) {
    count++;
  }
  return count;
}

function graphemeCount(text: string): number {
  if (oneUnitPerCharacter.test(text)) return text.length;
  let count = 0;
  for (const _ of segmenter.segment(text)) count++;
  return count;
}

function graphemesOf(text: string): string[] {
  if (oneUnitPerCharacter.test(text)) return text.split('');
  return Array.from(segmenter.segment(text), ({ segment }) => segment);
}
