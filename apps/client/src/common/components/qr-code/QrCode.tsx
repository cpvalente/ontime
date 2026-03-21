import { toString } from 'qrcode';
import { Suspense, use } from 'react';

interface QRCodeProps {
  value: string;
  size: number;
}

export default function QRCode({ value, size }: QRCodeProps) {
  'use memo';

  const svgPromise = toString(value, {
    width: size,
    margin: 2,
    color: { dark: '#101010', light: '#cfcfcf  ' },
  });

  return (
    <Suspense fallback={null}>
      <QrSvg svgPromise={svgPromise} />
    </Suspense>
  );
}

function QrSvg({ svgPromise }: { svgPromise: Promise<string> }) {
  'use memo';
  const svg = use(svgPromise);
  return <span dangerouslySetInnerHTML={{ __html: svg }} />;
}
