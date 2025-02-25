import { projectLogoPath } from '../../api/constants';

import './ViewLogo.scss';

interface ViewLogoProps {
  name: string;
  className: string;
}

export default function ViewLogo(props: ViewLogoProps) {
  const { name, className } = props;

  // we wrap the image in a div to help maintain the aspect ratio
  return (
    <div className={className}>
      <img alt='' src={`${projectLogoPath}/${name}`} className='viewLogo' />
    </div>
  );
}
