import { create } from 'qrcode';
import { Suspense, use } from 'react';

import { cx } from '../../utils/styleUtils';

import style from './QrCode.module.scss';

interface QRCodeProps {
  value: string;
  size: number;
}

// Quiet zone around the code, in modules
const margin = 2;
// Dot diameter as a fraction of a module. Close to 1 keeps the code reliably scannable
// while still reading as dots rather than solid squares
const dotScale = 0.94;
// Light dots on a dark card, to match Ontime's dark theme
const dotColor = '#f6f6f6';
const backgroundColor = '#101010';
// Position detection patterns (the three corner "eyes") are drawn as solid squares
// instead of dots, since scanners rely on their crisp edges to find the code
const finderPatternSize = 7;

export default function QRCode({ value, size }: QRCodeProps) {
  'use memo';
  const svgPromise = toDottedSvgString(value, size);

  return (
    <Suspense fallback={<QrFallback size={size} />}>
      <QrSvg svgPromise={svgPromise} size={size} />
    </Suspense>
  );
}

function QrFallback({ size }: { size: number }) {
  'use memo';
  return <span style={{ width: size + 2, height: size + 2 }} className={cx([style.blink, style.square])} />;
}

function QrSvg({ svgPromise, size }: { svgPromise: Promise<string>; size: number }) {
  'use memo';
  const svg = use(svgPromise);
  return (
    <span
      className={style.square}
      style={{ width: size + 2, height: size + 2 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/**
 * Encodes the given value and renders it as a dotted QR code (SVG string):
 * data modules become circles, while the three finder patterns stay solid for reliable scanning.
 */
async function toDottedSvgString(value: string, size: number): Promise<string> {
  const { modules } = create(value);
  const moduleCount = modules.size;
  const viewBoxSize = moduleCount + margin * 2;
  const dotRadius = dotScale / 2;

  let dots = '';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (isInFinderPattern(row, col, moduleCount) || !modules.get(row, col)) {
        continue;
      }
      const x = col + margin + 0.5;
      const y = row + margin + 0.5;
      dots += `<circle cx="${x}" cy="${y}" r="${dotRadius}"/>`;
    }
  }

  const finderPatterns =
    finderPattern(0, 0) +
    finderPattern(0, moduleCount - finderPatternSize) +
    finderPattern(moduleCount - finderPatternSize, 0);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">` +
    `<rect width="${viewBoxSize}" height="${viewBoxSize}" rx="3" fill="${backgroundColor}"/>` +
    `<g fill="${dotColor}">${dots}</g>${finderPatterns}</svg>`
  );
}

function isInFinderPattern(row: number, col: number, moduleCount: number) {
  const inTopRows = row < finderPatternSize;
  const inBottomRows = row >= moduleCount - finderPatternSize;
  const inLeftCols = col < finderPatternSize;
  const inRightCols = col >= moduleCount - finderPatternSize;
  return (inTopRows && inLeftCols) || (inTopRows && inRightCols) || (inBottomRows && inLeftCols);
}

/** Renders one of the three corner "eyes" as nested rounded squares, at (row, col) in module units */
function finderPattern(row: number, col: number) {
  const x = col + margin;
  const y = row + margin;
  return (
    `<rect x="${x}" y="${y}" width="7" height="7" rx="1.6" fill="${dotColor}"/>` +
    `<rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="1.1" fill="${backgroundColor}"/>` +
    `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.7" fill="${dotColor}"/>`
  );
}
