import { toString } from 'qrcode';
import { Suspense, use } from 'react';

import { cx } from '../../utils/styleUtils';

import style from './QrCode.module.scss';

interface QRCodeProps {
  value: string;
  size: number;
}

export default function QRCode({ value, size }: QRCodeProps) {
  'use memo';
  const svgPromise = toString(value, {
    width: size,
    margin: 2,
    color: { dark: '#101010', light: '#cfcfcf' },
  });

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
