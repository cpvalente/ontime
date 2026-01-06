import { useRef } from 'react';

import { projectLogoPath } from '../../api/constants';

import './ViewLogo.scss';

interface ViewLogoProps {
  name: string;
  className: string;
}

export default function ViewLogo({ name, className }: ViewLogoProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  const hideImage = () => {
    if (!imageRef.current) return;

    imageRef.current.style.display = 'none';
  };

  // we wrap the image in a div to help maintain the aspect ratio
  return (
    <div className={className}>
      <img ref={imageRef} alt='' src={`${projectLogoPath}/${name}`} className='viewLogo' onError={hideImage} />
    </div>
  );
}
