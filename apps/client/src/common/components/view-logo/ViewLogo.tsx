import { projectLogoPath } from '../../api/constants';

interface ViewLogoProps {
  name: string;
  className: string;
}

export default function ViewLogo(props: ViewLogoProps) {
  const { name, className } = props;
  return <img alt='' src={`${projectLogoPath}/${name}`} className={className} />;
}
