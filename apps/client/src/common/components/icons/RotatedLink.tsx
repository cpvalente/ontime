import { IconBaseProps } from 'react-icons';
import { IoLink } from 'react-icons/io5';

export default function RotatedLink(linkProps: IconBaseProps) {
  return <IoLink style={{ transform: 'rotate(-45deg)' }} {...linkProps} />;
}
